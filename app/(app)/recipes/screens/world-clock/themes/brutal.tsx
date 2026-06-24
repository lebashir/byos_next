import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster world clock (Müller-Brockmann in 1-bit). Each zone is
// a bold poster column: city reversed out of a black tab at the top, an ENORMOUS
// time figure filling the middle, day/date + offset as tiny labels at the foot.
// The page stays PREDOMINANTLY WHITE — black is reserved for the city tabs, the
// thick vertical rules between columns, and one short top rule, so the e-ink
// panel stays balanced and ghost-free.
// Pure #000 / #fff. Flexbox + inline SVG (solid fills only) — no grid, filter,
// gradient, shadow or opacity — so it survives the takumi/Satori renderer.
// CRITICAL: SVG children are wrapped in <g>, never a React Fragment (takumi
// silently drops Fragment-wrapped SVG nodes).
// ---------------------------------------------------------------------------

interface WorldClockBrutalProps {
	width?: number;
	height?: number;
	params?: {
		zones?: string;
		hour12?: boolean;
	};
}

interface ZoneInfo {
	city: string;
	time: string;
	dayDate: string;
	offset: string;
	hour: number;
	valid: boolean;
}

const MAX_ZONES = 7;

// Pull a single field value out of formatToParts for a given timeZone.
const getPart = (
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
): string => parts.find((p) => p.type === type)?.value ?? "";

// "America/New_York" -> "New York"
const cityFromZone = (zone: string): string => {
	const last = zone.split("/").pop() ?? zone;
	return last.replace(/_/g, " ");
};

const buildZoneInfo = (zone: string, now: Date, hour12: boolean): ZoneInfo => {
	const blank: ZoneInfo = {
		city: cityFromZone(zone),
		time: "--:--",
		dayDate: "",
		offset: "",
		hour: -1,
		valid: false,
	};

	if (!zone) return blank;

	try {
		// Time (HH:MM, 12/24h per param).
		const timeParts = new Intl.DateTimeFormat(hour12 ? "en-US" : "en-GB", {
			timeZone: zone,
			hour: "2-digit",
			minute: "2-digit",
			hour12,
		}).formatToParts(now);

		const hourStr = getPart(timeParts, "hour");
		const minuteStr = getPart(timeParts, "minute");
		const time = `${hourStr}:${minuteStr}`;

		// 24h hour for the day/night indicator, independent of display format.
		const hour24Str =
			new Intl.DateTimeFormat("en-GB", {
				timeZone: zone,
				hour: "2-digit",
				hour12: false,
			})
				.formatToParts(now)
				.find((p) => p.type === "hour")?.value ?? "";
		const hour = Number.parseInt(hour24Str, 10);

		// Day + date, e.g. "Mon 23 Jun".
		const dateParts = new Intl.DateTimeFormat("en-GB", {
			timeZone: zone,
			weekday: "short",
			day: "2-digit",
			month: "short",
		}).formatToParts(now);
		const dayDate = `${getPart(dateParts, "weekday")} ${getPart(
			dateParts,
			"day",
		)} ${getPart(dateParts, "month")}`;

		// UTC offset, e.g. "GMT+1".
		const tzParts = new Intl.DateTimeFormat("en-GB", {
			timeZone: zone,
			timeZoneName: "shortOffset",
			hour: "2-digit",
		}).formatToParts(now);
		let offset = getPart(tzParts, "timeZoneName");
		if (!offset) {
			const longParts = new Intl.DateTimeFormat("en-GB", {
				timeZone: zone,
				timeZoneName: "short",
				hour: "2-digit",
			}).formatToParts(now);
			offset = getPart(longParts, "timeZoneName");
		}
		// Normalize "UTC+1" / "GMT+01:00" presentations to a compact "GMT±H".
		offset = offset.replace(/^UTC/, "GMT");

		return {
			city: cityFromZone(zone),
			time,
			dayDate,
			offset,
			hour: Number.isNaN(hour) ? -1 : hour,
			valid: true,
		};
	} catch {
		// Invalid / unknown zone string -> blank column rather than throwing.
		return blank;
	}
};

// Flat geometric 1-bit sun — solid disc + chunky square rays (reversible `ink`).
const SunGlyph = ({ size, ink }: { size: number; ink: string }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Day"
	>
		<title>Day</title>
		<g>
			<circle cx="50" cy="50" r="20" fill={ink} />
			<rect x="46" y="8" width="8" height="14" fill={ink} />
			<rect x="46" y="78" width="8" height="14" fill={ink} />
			<rect x="8" y="46" width="14" height="8" fill={ink} />
			<rect x="78" y="46" width="14" height="8" fill={ink} />
			<rect x="20" y="20" width="12" height="8" fill={ink} />
			<rect x="68" y="72" width="12" height="8" fill={ink} />
			<rect x="68" y="20" width="12" height="8" fill={ink} />
			<rect x="20" y="72" width="12" height="8" fill={ink} />
		</g>
	</svg>
);

// Flat geometric 1-bit crescent moon — a solid disc with a bite taken out by an
// offset disc of the BACKGROUND colour (reversible via `ink` / `paper`).
const MoonGlyph = ({
	size,
	ink,
	paper,
}: {
	size: number;
	ink: string;
	paper: string;
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Night"
	>
		<title>Night</title>
		<g>
			<circle cx="50" cy="50" r="34" fill={ink} />
			<circle cx="64" cy="42" r="28" fill={paper} />
		</g>
	</svg>
);

// Size the city headline so the WHOLE name fits inside the black tab; long names
// (e.g. "Buenos Aires") step the font down rather than getting sheared off.
function cityFontSize(s: string, columns: number): number {
	const base = columns <= 3 ? 30 : columns <= 5 ? 24 : 19;
	const n = s.length;
	if (n <= 7) return base;
	if (n <= 10) return Math.round(base * 0.82);
	if (n <= 14) return Math.round(base * 0.68);
	return Math.round(base * 0.56);
}

export default function WorldClockBrutal({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: WorldClockBrutalProps) {
	const rawZones = params?.zones ?? "";
	const hour12 = params?.hour12 ?? false;

	const zones = rawZones
		.split(",")
		.map((z) => z.trim())
		.filter((z) => z.length > 0)
		.slice(0, MAX_ZONES);

	const now = new Date();
	const columns = (zones.length > 0 ? zones : [""]).map((zone) =>
		buildZoneInfo(zone, now, hour12),
	);

	const count = columns.length;
	// Scale the hero time down as columns get crowded so big strings never clip.
	const timeSize = count <= 2 ? 96 : count <= 3 ? 80 : count <= 5 ? 58 : 44;
	const iconSize = count <= 5 ? 30 : 24;
	const RULE = 6; // thick black vertical rule between columns
	const TAB_H = count <= 5 ? 56 : 46; // black city tab height

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-blockKie"
				style={{
					display: "flex",
					flexDirection: "column",
					width,
					height,
					backgroundColor: "#fff",
					color: "#000",
					boxSizing: "border-box",
				}}
			>
				{/* Thin top rule — a single hard black edge across the whole poster. */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* Column strip. */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						minHeight: 0,
						overflow: "hidden",
					}}
				>
					{columns.map((col, idx) => {
						const last = idx === count - 1;
						const isDay = col.hour >= 6 && col.hour < 18;
						return (
							<div
								key={`${col.city}-${idx}`}
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									minWidth: 0,
									overflow: "hidden",
									// Thick black rule between columns (not after the last).
									borderRight: last ? "0px solid #000" : `${RULE}px solid #000`,
								}}
							>
								{/* CITY TAB — reversed out white on solid black. */}
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										height: TAB_H,
										backgroundColor: "#000",
										paddingLeft: 6,
										paddingRight: 6,
										boxSizing: "border-box",
										overflow: "hidden",
										flexShrink: 0,
									}}
								>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											color: "#fff",
											fontSize: cityFontSize(col.city, count),
											lineHeight: 1,
											letterSpacing: -0.5,
											textAlign: "center",
											overflow: "hidden",
										}}
									>
										{(col.city || "—").toUpperCase()}
									</div>
								</div>

								{/* HERO TIME — enormous black figure on white. */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										flex: 1,
										minHeight: 0,
										paddingLeft: 4,
										paddingRight: 4,
										overflow: "hidden",
									}}
								>
									{/* Day / night mark above the figure. */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											height: iconSize,
											marginBottom: 8,
										}}
									>
										{col.valid ? (
											isDay ? (
												<SunGlyph size={iconSize} ink="#000" />
											) : (
												<MoonGlyph size={iconSize} ink="#000" paper="#fff" />
											)
										) : null}
									</div>

									<div
										className="font-blockKie"
										style={{
											display: "flex",
											fontSize: timeSize,
											lineHeight: 0.9,
											letterSpacing: count <= 3 ? -3 : -1.5,
											textAlign: "center",
										}}
									>
										{col.time}
									</div>
								</div>

								{/* FOOT — tiny day/date + offset labels. */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										paddingBottom: 14,
										paddingLeft: 4,
										paddingRight: 4,
										flexShrink: 0,
										overflow: "hidden",
									}}
								>
									{/* Short black rule above the labels. */}
									<div
										style={{
											display: "flex",
											width: 28,
											height: 3,
											backgroundColor: "#000",
											marginBottom: 8,
										}}
									/>
									<div
										className="font-geneva9"
										style={{
											display: "flex",
											fontSize: 15,
											lineHeight: 1.1,
											textAlign: "center",
										}}
									>
										{(col.dayDate || "—").toUpperCase()}
									</div>
									{col.offset ? (
										<div
											className="font-geneva9"
											style={{
												display: "flex",
												fontSize: 15,
												marginTop: 4,
												textAlign: "center",
											}}
										>
											{col.offset.toUpperCase()}
										</div>
									) : null}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</PreSatori>
	);
}
