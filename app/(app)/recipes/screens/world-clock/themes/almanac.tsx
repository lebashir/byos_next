import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// WORLD-CLOCK-ALMANAC — the world-clock screen rendered as a page of an
// antique printed almanac: "THE TABLE OF MERIDIANS".
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic, matching wg-almanac:
//   • double-rule page frame, centered masthead, ✦/✱ ornament dividers
//   • ruled "meridians" table with geneva9 small-caps labels
//   • engraving-style sun / moon glyphs, geneva9 colophon footer
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 2px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface WorldClockAlmanacProps {
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

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

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

// Per-zone time logic, reused from the world-clock original.
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
		const dayPeriod = getPart(timeParts, "dayPeriod");
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
		offset = offset.replace(/^UTC/, "GMT");

		return {
			city: cityFromZone(zone),
			time: hour12 && dayPeriod ? `${time} ${dayPeriod.toUpperCase()}` : time,
			dayDate,
			offset,
			hour: Number.isNaN(hour) ? -1 : hour,
			valid: true,
		};
	} catch {
		return blank;
	}
};

// Today's dateline, e.g. "WEDNESDAY, JUNE 24, 2026".
function todayLabel(): string {
	try {
		const fmt = new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		}).format(new Date());
		return fmt.toUpperCase();
	} catch {
		return "";
	}
}

// ---------------------------------------------------------------------------
// Engraving-style sun / moon glyphs. Outline only, strokes >= 2px.
// ---------------------------------------------------------------------------

const SunGlyph = ({ size }: { size: number }) => {
	const c = size / 2;
	const r = size * 0.2;
	const inner = r + size * 0.07;
	const outer = size * 0.46;
	const rays = [0, 45, 90, 135, 180, 225, 270, 315];
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="day"
		>
			<title>day</title>
			<g>
				<circle cx={c} cy={c} r={r} fill="none" stroke="#000" strokeWidth={2} />
				{rays.map((deg) => {
					const a = (deg * Math.PI) / 180;
					return (
						<line
							key={deg}
							x1={c + Math.cos(a) * inner}
							y1={c + Math.sin(a) * inner}
							x2={c + Math.cos(a) * outer}
							y2={c + Math.sin(a) * outer}
							stroke="#000"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					);
				})}
			</g>
		</svg>
	);
};

const MoonGlyph = ({ size }: { size: number }) => {
	const c = size / 2;
	const r = size * 0.36;
	const off = size * 0.16;
	const topX = c;
	const topY = c - r;
	const botX = c;
	const botY = c + r;
	const d = [
		`M ${topX} ${topY}`,
		`A ${r} ${r} 0 1 0 ${botX} ${botY}`,
		`A ${r * 0.95} ${r * 0.95} 0 1 1 ${topX} ${topY}`,
		"Z",
	].join(" ");
	// A few engraving stars to flank the crescent.
	const stars: Array<[number, number, number]> = [
		[size * 0.74, size * 0.3, size * 0.05],
		[size * 0.82, size * 0.56, size * 0.035],
	];
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="night"
		>
			<title>night</title>
			<g>
				<path
					d={d}
					fill="none"
					stroke="#000"
					strokeWidth={2}
					transform={`translate(${off} 0)`}
				/>
				{stars.map(([sx, sy, sr]) => (
					<g key={`${sx}-${sy}`} stroke="#000" strokeWidth={2}>
						<line x1={sx - sr} y1={sy} x2={sx + sr} y2={sy} />
						<line x1={sx} y1={sy - sr} x2={sx} y2={sy + sr} />
					</g>
				))}
			</g>
		</svg>
	);
};

// ---------------------------------------------------------------------------
// Centered decorative divider: hairline — diamond — ✱ asterisk — diamond —
// hairline. Mirrors wg-almanac's OrnDivider.
// ---------------------------------------------------------------------------
function OrnDivider({ width, h = 14 }: { width: number; h?: number }) {
	const cx = width / 2;
	const mid = h / 2;
	const gap = 26;
	return (
		<div style={{ display: "flex" }}>
			<svg
				width={width}
				height={h}
				viewBox={`0 0 ${width} ${h}`}
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>ornament</title>
				<g>
					<line
						x1={6}
						y1={mid}
						x2={cx - gap}
						y2={mid}
						stroke="#000"
						strokeWidth={1.5}
					/>
					<line
						x1={cx + gap}
						y1={mid}
						x2={width - 6}
						y2={mid}
						stroke="#000"
						strokeWidth={1.5}
					/>
					<path d={`M${cx - gap + 6} ${mid} l4 -4 l4 4 l-4 4 Z`} fill="#000" />
					<path d={`M${cx + gap - 6} ${mid} l4 -4 l4 4 l-4 4 Z`} fill="#000" />
					<g stroke="#000" strokeWidth={1.8} strokeLinecap="round">
						<line x1={cx} y1={mid - 5} x2={cx} y2={mid + 5} />
						<line x1={cx - 5} y1={mid - 2.5} x2={cx + 5} y2={mid + 2.5} />
						<line x1={cx + 5} y1={mid - 2.5} x2={cx - 5} y2={mid + 2.5} />
					</g>
				</g>
			</svg>
		</div>
	);
}

export default function WorldClockAlmanac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: WorldClockAlmanacProps) {
	const rawZones = params?.zones ?? "";
	const hour12 = params?.hour12 ?? false;

	const zones = rawZones
		.split(",")
		.map((z) => z.trim())
		.filter((z) => z.length > 0)
		.slice(0, MAX_ZONES);

	const now = new Date();
	const rows = (zones.length > 0 ? zones : [""]).map((zone) =>
		buildZoneInfo(zone, now, hour12),
	);
	const dateline = todayLabel();

	// Inner page metrics (inside the double-rule frame), matching wg-almanac.
	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;

	// The hero time face scales down as the table grows so 7 rows still fit.
	const n = rows.length;
	const timeSize = n <= 3 ? 46 : n <= 5 ? 38 : 30;
	const citySize = n <= 5 ? 24 : 20;
	const glyphSize = n <= 5 ? 34 : 26;
	const rowPadY = n <= 3 ? 10 : n <= 5 ? 6 : 3;

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-inter"
				style={{
					display: "flex",
					width,
					height,
					boxSizing: "border-box",
					padding: FRAME,
				}}
			>
				{/* ============ outer 2px rule ============ */}
				<div
					style={{
						display: "flex",
						flex: 1,
						border: "2px solid #000",
						boxSizing: "border-box",
						padding: RULE_GAP,
					}}
				>
					{/* ============ inner 1px rule ============ */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							border: "1px solid #000",
							boxSizing: "border-box",
							padding: "10px 16px 12px",
						}}
					>
						{/* ================= MASTHEAD ================= */}
						<div
							style={{
								display: "flex",
								height: 5,
								backgroundColor: "#000",
								marginBottom: 6,
							}}
						/>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: 15,
								marginBottom: 6,
								...SCAPS,
							}}
						>
							THE UNIVERSAL ALMANAC
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: 40,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
							}}
						>
							Table of Meridians
						</div>
						<div
							style={{
								display: "flex",
								height: 1.5,
								backgroundColor: "#000",
								marginTop: 6,
							}}
						/>
						{dateline ? (
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 15,
									paddingTop: 4,
									...SCAPS,
								}}
							>
								<div style={{ display: "flex" }}>{dateline}</div>
								<div style={{ display: "flex" }}>
									{hour12 ? "CLOCK XII" : "CLOCK XXIV"}
								</div>
							</div>
						) : null}

						{/* ============ ornament between masthead & table ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== MERIDIANS TABLE ===================== */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								border: "1.5px solid #000",
								boxSizing: "border-box",
							}}
						>
							{/* column heads */}
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									borderBottom: "1.5px solid #000",
									padding: "3px 12px",
									fontSize: 15,
									...SCAPS,
								}}
							>
								<div style={{ display: "flex", flex: 1 }}>CITY</div>
								<div
									style={{
										display: "flex",
										width: 150,
										justifyContent: "flex-end",
									}}
								>
									HOUR
								</div>
								<div
									style={{
										display: "flex",
										width: 150,
										justifyContent: "flex-end",
									}}
								>
									DATE
								</div>
								<div
									style={{
										display: "flex",
										width: 54,
										justifyContent: "center",
									}}
								>
									SKY
								</div>
							</div>

							{/* zone rows */}
							{rows.map((row, idx) => {
								const isDay = row.hour >= 6 && row.hour < 18;
								return (
									<div
										key={`${row.city}-${idx}`}
										style={{
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
											flex: 1,
											padding: `${rowPadY}px 12px`,
											borderBottom:
												idx < n - 1 ? "1px solid #000" : "0px solid #000",
										}}
									>
										{/* city + offset */}
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												flex: 1,
												overflow: "hidden",
											}}
										>
											<div
												className="font-blockKie"
												style={{
													display: "flex",
													fontSize: citySize,
													lineHeight: 1.05,
													whiteSpace: "nowrap",
												}}
											>
												{row.city}
											</div>
											{row.offset ? (
												<div
													className="font-geneva9"
													style={{
														display: "flex",
														fontSize: 15,
														letterSpacing: 1,
													}}
												>
													{row.offset}
												</div>
											) : null}
										</div>

										{/* big time */}
										<div
											className="font-inter"
											style={{
												display: "flex",
												width: 150,
												justifyContent: "flex-end",
												alignItems: "baseline",
												fontSize: timeSize,
												lineHeight: 1,
											}}
										>
											{row.time}
										</div>

										{/* date */}
										<div
											className="font-inter"
											style={{
												display: "flex",
												width: 150,
												justifyContent: "flex-end",
												fontSize: 18,
											}}
										>
											{row.dayDate || "—"}
										</div>

										{/* sun / moon plate */}
										<div
											style={{
												display: "flex",
												width: 54,
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{row.valid ? (
												isDay ? (
													<SunGlyph size={glyphSize} />
												) : (
													<MoonGlyph size={glyphSize} />
												)
											) : null}
										</div>
									</div>
								);
							})}
						</div>

						{/* ================= COLOPHON ================= */}
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: 15,
								paddingTop: 6,
								...SCAPS,
							}}
						>
							<div style={{ display: "flex" }}>
								PRINTED BY BYOS · EST. MMXXVI
							</div>
							<div style={{ display: "flex" }}>☉ DAY · ☾ NIGHT</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
