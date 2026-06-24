// Live data — always fetch fresh.
export const dynamic = "force-dynamic";

type F1Params = {
	season?: string;
};

export interface F1Data {
	raceName: string;
	round: string;
	circuitName: string;
	circuitId: string;
	country: string;
	locality: string;
	dateISO: string;
	message?: string;
}

// Maintained Ergast mirror.
const ERGAST = "https://api.jolpi.ca/ergast/f1";

const EMPTY: F1Data = {
	raceName: "",
	round: "",
	circuitName: "",
	circuitId: "",
	country: "",
	locality: "",
	dateISO: "",
};

// Shape of a single race entry in the Ergast/Jolpica payload.
interface ErgastRace {
	round?: string;
	raceName?: string;
	date?: string;
	time?: string;
	Circuit?: {
		circuitId?: string;
		circuitName?: string;
		Location?: {
			country?: string;
			locality?: string;
		};
	};
}

interface ErgastResponse {
	MRData?: {
		RaceTable?: {
			Races?: ErgastRace[];
		};
	};
}

async function fetchJson<T>(
	url: string,
	signal: AbortSignal,
): Promise<T | null> {
	try {
		const res = await fetch(url, { signal });
		return res.ok ? ((await res.json()) as T) : null;
	} catch {
		return null;
	}
}

function pickRace(json: ErgastResponse | null): ErgastRace | null {
	const races = json?.MRData?.RaceTable?.Races;
	if (!races || races.length === 0) return null;
	return races[races.length - 1] ?? null;
}

function mapRace(race: ErgastRace): F1Data {
	const date = race.date ?? "";
	const time = race.time ?? "";
	const dateISO = date ? (time ? `${date}T${time}` : date) : "";
	return {
		raceName: race.raceName ?? "",
		round: race.round ?? "",
		circuitName: race.Circuit?.circuitName ?? "",
		circuitId: race.Circuit?.circuitId ?? "",
		country: race.Circuit?.Location?.country ?? "",
		locality: race.Circuit?.Location?.locality ?? "",
		dateISO,
	};
}

function isYear(v: string | undefined): v is string {
	return typeof v === "string" && /^\d{4}$/.test(v.trim());
}

export default async function getData(params?: F1Params): Promise<F1Data> {
	const season = params?.season?.trim() || "current";

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 8000);
	try {
		if (isYear(season)) {
			// Explicit year: try the next upcoming race for that season first.
			const next = await fetchJson<ErgastResponse>(
				`${ERGAST}/${season}/next.json`,
				ctrl.signal,
			);
			const nextRace = pickRace(next);
			if (nextRace) return mapRace(nextRace);

			// Off-season (no upcoming race): fall back to the last race of that year.
			const season_ = await fetchJson<ErgastResponse>(
				`${ERGAST}/${season}.json`,
				ctrl.signal,
			);
			const lastRace = pickRace(season_);
			if (lastRace) return mapRace(lastRace);

			return { ...EMPTY, message: "F1 schedule unavailable right now." };
		}

		// "current" (or anything non-year): the maintained next-race endpoint.
		const json = await fetchJson<ErgastResponse>(
			`${ERGAST}/current/next.json`,
			ctrl.signal,
		);
		const race = pickRace(json);
		if (race) return mapRace(race);

		return { ...EMPTY, message: "F1 schedule unavailable right now." };
	} catch {
		return { ...EMPTY, message: "F1 schedule unavailable right now." };
	} finally {
		clearTimeout(timer);
	}
}
