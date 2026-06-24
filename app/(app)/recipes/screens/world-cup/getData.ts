export const dynamic = "force-dynamic";

// Live World Cup scores from ESPN's public (keyless) scoreboard API. The
// `fifa.world` league slug is the FIFA World Cup. We show today's slate
// ordered live -> upcoming -> finished; if there are no matches today (a
// rest day) we fall back to the next day that has fixtures so the frame is
// never blank.
const ESPN_SCOREBOARD =
	"https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

// The frame renders server-side (UTC) and can't detect location, so the
// display timezone is the recipe's `timezone` param. This is the fallback
// when it's unset or invalid.
const DEFAULT_TZ = "Asia/Beirut";
const FETCH_TIMEOUT_MS = 8000;
const MAX_MATCHES = 8;

export type WorldCupMatch = {
	home: string;
	away: string;
	homeScore: string;
	awayScore: string;
	/** "pre" (scheduled) | "in" (live) | "post" (finished) */
	state: string;
	/** Short status: "46'", "HT", "FT", or a kickoff time like "19:00". */
	detail: string;
	live: boolean;
};

export type WorldCupData = {
	title: string;
	dateLabel: string;
	updatedLabel: string;
	matches: WorldCupMatch[];
	message?: string;
};

type EspnCompetitor = {
	homeAway?: string;
	score?: string;
	team?: { abbreviation?: string; shortDisplayName?: string; name?: string };
};
type EspnEvent = {
	date?: string;
	status?: {
		type?: { state?: string; shortDetail?: string; completed?: boolean };
	};
	competitions?: { competitors?: EspnCompetitor[] }[];
};

function isValidTimeZone(tz: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

function ymd(d: Date): string {
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${y}${m}${day}`;
}

// "WED JUN 25" in the given timezone.
function dateHeader(iso: string, tz: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: tz,
		weekday: "short",
		month: "short",
		day: "numeric",
	}).formatToParts(d);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("weekday")} ${get("month")} ${get("day")}`.toUpperCase();
}

// "19:00" in the given timezone.
function timeIn(d: Date, tz: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: tz,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(d);
}

function kickoffLabel(iso: string, tz: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return timeIn(d, tz);
}

function teamCode(c: EspnCompetitor | undefined): string {
	const t = c?.team;
	return t?.abbreviation || t?.shortDisplayName || t?.name || "—";
}

const STATE_ORDER: Record<string, number> = { in: 0, pre: 1, post: 2 };

function toMatch(ev: EspnEvent, tz: string): WorldCupMatch | null {
	const comp = ev.competitions?.[0];
	const competitors = comp?.competitors ?? [];
	const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
	const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
	if (!home || !away) return null;
	const state = ev.status?.type?.state ?? "pre";
	const live = state === "in";
	let detail = ev.status?.type?.shortDetail ?? "";
	if (state === "pre") detail = kickoffLabel(ev.date ?? "", tz);
	else if (state === "post") detail = "FT";
	return {
		home: teamCode(home),
		away: teamCode(away),
		homeScore: state === "pre" ? "" : (home.score ?? ""),
		awayScore: state === "pre" ? "" : (away.score ?? ""),
		state,
		detail,
		live,
	};
}

function orderMatches(events: EspnEvent[], tz: string): WorldCupMatch[] {
	return events
		.map((ev) => toMatch(ev, tz))
		.filter((m): m is WorldCupMatch => m !== null)
		.sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9))
		.slice(0, MAX_MATCHES);
}

async function fetchScoreboard(
	query: string,
	signal: AbortSignal,
): Promise<EspnEvent[]> {
	const res = await fetch(`${ESPN_SCOREBOARD}${query}`, {
		signal,
		cache: "no-store",
	});
	if (!res.ok) throw new Error(`ESPN ${res.status}`);
	const data = (await res.json()) as { events?: EspnEvent[] };
	return data.events ?? [];
}

export default async function getWorldCupData(params?: {
	timezone?: string;
}): Promise<WorldCupData> {
	const requested = params?.timezone?.trim();
	const tz = requested && isValidTimeZone(requested) ? requested : DEFAULT_TZ;
	const updatedLabel = timeIn(new Date(), tz);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		// Today's slate (ESPN's default scoreboard is the current matchday).
		let events = await fetchScoreboard("", controller.signal);
		let dateLabel = "";

		if (events.length === 0) {
			// Rest day: look ahead ~10 days and use the earliest day with fixtures.
			const today = new Date();
			const end = new Date(today.getTime() + 9 * 86_400_000);
			const ahead = await fetchScoreboard(
				`?dates=${ymd(today)}-${ymd(end)}`,
				controller.signal,
			);
			ahead.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
			const firstDay = ahead[0]?.date?.slice(0, 10);
			events = firstDay
				? ahead.filter((e) => (e.date ?? "").slice(0, 10) === firstDay)
				: [];
			if (events[0]?.date)
				dateLabel = `NEXT · ${dateHeader(events[0].date, tz)}`;
		} else if (events[0]?.date) {
			dateLabel = dateHeader(events[0].date, tz);
		}

		const matches = orderMatches(events, tz);
		if (matches.length === 0) {
			return {
				title: "FIFA WORLD CUP",
				dateLabel: "",
				updatedLabel,
				matches: [],
				message: "No World Cup matches scheduled.",
			};
		}
		return { title: "FIFA WORLD CUP", dateLabel, updatedLabel, matches };
	} catch (_error) {
		return {
			title: "FIFA WORLD CUP",
			dateLabel: "",
			updatedLabel,
			matches: [],
			message: "World Cup scores unavailable right now.",
		};
	} finally {
		clearTimeout(timeout);
	}
}
