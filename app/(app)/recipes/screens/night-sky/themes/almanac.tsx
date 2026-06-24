import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// NIGHT-SKY-ALMANAC — the computed local star chart mounted as a circular
// "Celestial Chart" plate in a vintage broadsheet / Old Farmer's Almanac page.
//
// The art is the hero: the original Night Sky star catalog + horizontal-
// coordinate projection math (computed from new Date() + lat/lon) is LIFTED
// VERBATIM into one inline <svg viewBox="0 0 S S"> sized to a circular plate.
// Around it sits the almanac furniture — a "Celestial Chart" masthead, a
// circular plate with registration ticks, an engraved caption carrying the
// lat/lon + date, and a colophon.
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

type NightSkyParams = {
	lat?: number;
	lon?: number;
	showLines?: boolean;
};

interface NightSkyAlmanacProps {
	width?: number;
	height?: number;
	params?: NightSkyParams;
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// ===========================================================================
// Star catalog + constellation lines + projection math, lifted VERBATIM from
// ../night-sky/night-sky. The chart is computed at render time from the local
// date and the given lat/lon; no network access.
// ===========================================================================

interface CatalogStar {
	name: string;
	ra: number;
	dec: number;
	mag: number;
}

const STARS: CatalogStar[] = [
	// Brightest stars
	{ name: "Sirius", ra: 6.752, dec: -16.716, mag: -1.46 },
	{ name: "Canopus", ra: 6.399, dec: -52.696, mag: -0.74 },
	{ name: "Rigil Kentaurus", ra: 14.66, dec: -60.835, mag: -0.27 },
	{ name: "Arcturus", ra: 14.261, dec: 19.182, mag: -0.05 },
	{ name: "Vega", ra: 18.616, dec: 38.784, mag: 0.03 },
	{ name: "Capella", ra: 5.278, dec: 45.998, mag: 0.08 },
	{ name: "Rigel", ra: 5.242, dec: -8.202, mag: 0.13 },
	{ name: "Procyon", ra: 7.655, dec: 5.225, mag: 0.34 },
	{ name: "Betelgeuse", ra: 5.919, dec: 7.407, mag: 0.5 },
	{ name: "Achernar", ra: 1.629, dec: -57.237, mag: 0.46 },
	{ name: "Hadar", ra: 14.064, dec: -60.373, mag: 0.61 },
	{ name: "Altair", ra: 19.846, dec: 8.868, mag: 0.77 },
	{ name: "Aldebaran", ra: 4.599, dec: 16.509, mag: 0.85 },
	{ name: "Antares", ra: 16.49, dec: -26.432, mag: 1.09 },
	{ name: "Spica", ra: 13.42, dec: -11.161, mag: 1.04 },
	{ name: "Pollux", ra: 7.755, dec: 28.026, mag: 1.14 },
	{ name: "Fomalhaut", ra: 22.961, dec: -29.622, mag: 1.16 },
	{ name: "Deneb", ra: 20.69, dec: 45.28, mag: 1.25 },
	{ name: "Regulus", ra: 10.139, dec: 11.967, mag: 1.35 },
	{ name: "Castor", ra: 7.577, dec: 31.888, mag: 1.58 },
	{ name: "Bellatrix", ra: 5.418, dec: 6.35, mag: 1.64 },
	{ name: "Elnath", ra: 5.438, dec: 28.608, mag: 1.65 },
	{ name: "Alnilam", ra: 5.604, dec: -1.202, mag: 1.69 },
	{ name: "Alnitak", ra: 5.679, dec: -1.943, mag: 1.74 },
	{ name: "Alioth", ra: 12.9, dec: 55.96, mag: 1.77 },
	{ name: "Mirfak", ra: 3.405, dec: 49.861, mag: 1.79 },
	{ name: "Dubhe", ra: 11.062, dec: 61.751, mag: 1.79 },
	{ name: "Mintaka", ra: 5.533, dec: -0.299, mag: 2.23 },
	{ name: "Alkaid", ra: 13.792, dec: 49.313, mag: 1.86 },
	{ name: "Polaris", ra: 2.53, dec: 89.264, mag: 1.98 },
	{ name: "Algol", ra: 3.136, dec: 40.956, mag: 2.12 },
	{ name: "Denebola", ra: 11.818, dec: 14.572, mag: 2.14 },
	{ name: "Mizar", ra: 13.399, dec: 54.925, mag: 2.23 },
	{ name: "Merak", ra: 11.031, dec: 56.382, mag: 2.37 },
	{ name: "Phecda", ra: 11.897, dec: 53.695, mag: 2.44 },
	{ name: "Megrez", ra: 12.257, dec: 57.033, mag: 3.31 },
	// Cassiopeia's 5
	{ name: "Schedar", ra: 0.675, dec: 56.537, mag: 2.24 },
	{ name: "Caph", ra: 0.153, dec: 59.15, mag: 2.28 },
	{ name: "Gamma Cas", ra: 0.945, dec: 60.717, mag: 2.47 },
	{ name: "Ruchbah", ra: 1.43, dec: 60.235, mag: 2.68 },
	{ name: "Segin", ra: 1.906, dec: 63.67, mag: 3.38 },
	// Orion extras (shoulders/knees/head)
	{ name: "Saiph", ra: 5.796, dec: -9.67, mag: 2.07 },
	{ name: "Meissa", ra: 5.585, dec: 9.934, mag: 3.39 },
	// A few more recognizable navigation stars
	{ name: "Hamal", ra: 2.119, dec: 23.462, mag: 2.0 },
	{ name: "Diphda", ra: 0.726, dec: -17.987, mag: 2.04 },
	{ name: "Alphard", ra: 9.46, dec: -8.659, mag: 1.98 },
	{ name: "Alpheratz", ra: 0.139, dec: 29.09, mag: 2.06 },
	{ name: "Kochab", ra: 14.845, dec: 74.156, mag: 2.08 },
	{ name: "Saiph2", ra: 17.56, dec: -37.104, mag: 1.86 },
	{ name: "Nunki", ra: 18.921, dec: -26.297, mag: 2.05 },
];

const LINES: [string, string][] = [
	// Orion: belt
	["Alnitak", "Alnilam"],
	["Alnilam", "Mintaka"],
	// Orion: shoulders to belt to knees
	["Betelgeuse", "Alnitak"],
	["Bellatrix", "Mintaka"],
	["Alnitak", "Saiph"],
	["Mintaka", "Rigel"],
	["Betelgeuse", "Bellatrix"],
	["Rigel", "Saiph"],
	// Big Dipper (Ursa Major bowl + handle)
	["Dubhe", "Merak"],
	["Merak", "Phecda"],
	["Phecda", "Megrez"],
	["Megrez", "Dubhe"],
	["Megrez", "Alioth"],
	["Alioth", "Mizar"],
	["Mizar", "Alkaid"],
	// Cassiopeia W
	["Segin", "Ruchbah"],
	["Ruchbah", "Gamma Cas"],
	["Gamma Cas", "Schedar"],
	["Schedar", "Caph"],
];

const DEG = Math.PI / 180;
const HALF_PI = Math.PI / 2;

interface ProjectedStar extends CatalogStar {
	x: number;
	y: number;
	r: number;
}

function buildChart(
	lat: number,
	lon: number,
	cx: number,
	cy: number,
	R: number,
) {
	// Days since J2000.0 epoch.
	const d = Date.now() / 86400000 - 10957.5;
	const gmst = (280.46061837 + 360.98564736629 * d) % 360;
	const gmstDeg = ((gmst % 360) + 360) % 360;
	const lstDeg = (((gmstDeg + lon) % 360) + 360) % 360;

	const latR = lat * DEG;
	const sinLat = Math.sin(latR);
	const cosLat = Math.cos(latR);

	const visible = new Map<string, ProjectedStar>();

	for (const star of STARS) {
		const hDeg = lstDeg - star.ra * 15;
		const hR = hDeg * DEG;
		const decR = star.dec * DEG;

		const sinAlt =
			Math.sin(decR) * sinLat + Math.cos(decR) * cosLat * Math.cos(hR);
		const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

		// Standard azimuth formula (measured from North, through East).
		let az = Math.atan2(
			-Math.sin(hR),
			cosLat * Math.tan(decR) - sinLat * Math.cos(hR),
		);
		az = ((az % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

		// Skip stars below the horizon or any NaN edge cases.
		if (!Number.isFinite(alt) || !Number.isFinite(az) || alt <= 0) continue;

		const rr = (1 - alt / HALF_PI) * R;
		const x = cx + rr * Math.sin(az);
		const y = cy - rr * Math.cos(az);
		if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

		const r = Math.max(1.2, 3.2 - 0.5 * star.mag);
		visible.set(star.name, { ...star, x, y, r });
	}

	return visible;
}

// ---------------------------------------------------------------------------
// Today's dateline, e.g. "WEDNESDAY, JUNE 24, 2026".
// ---------------------------------------------------------------------------
function todayLabel(): string {
	try {
		return new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		})
			.format(new Date())
			.toUpperCase();
	} catch {
		return "";
	}
}

// ---------------------------------------------------------------------------
// Centered decorative divider, mirroring the reference almanac's OrnDivider.
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

export default function NightSkyAlmanac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: NightSkyAlmanacProps) {
	const lat = params?.lat ?? 40.71;
	const lon = params?.lon ?? -74.0;
	const showLines = params?.showLines ?? true;

	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;
	const dateline = todayLabel();

	// Square logical canvas for the circular plate. The chart fills it with a
	// margin left for the cardinal letters around the rim.
	const S = 480;
	const cx = S / 2;
	const cy = S / 2;
	const R = S / 2 - 30;

	// Fixed pixel box for the circular plate. Under takumi an inline <svg>
	// with percentage / aspect-ratio sizing inside a flex:1 parent collapses to
	// zero, so we size the disc explicitly: a square that fits both the available
	// content width and the plate height (total minus the masthead / dateline /
	// ornament / caption / colophon chrome above and below it).
	const CHROME_H = 250;
	const plateBoxH = Math.max(120, height - CHROME_H);
	const chartSide = Math.max(80, Math.min(contentW, plateBoxH));

	const visible = buildChart(lat, lon, cx, cy, R);
	const stars = Array.from(visible.values());

	const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
	const locLabel = `LAT ${fmt(lat)} · LON ${fmt(lon)}`;

	// Cardinal labels around the rim (sky chart looking up: East on the LEFT).
	const cardinals: { label: string; x: number; y: number }[] = [
		{ label: "N", x: cx, y: cy - R - 14 },
		{ label: "S", x: cx, y: cy + R + 14 },
		{ label: "E", x: cx - R - 14, y: cy },
		{ label: "W", x: cx + R + 14, y: cy },
	];

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
							padding: "8px 16px 10px",
						}}
					>
						{/* ================= MASTHEAD ================= */}
						<div
							style={{
								display: "flex",
								height: 5,
								backgroundColor: "#000",
								marginBottom: 5,
							}}
						/>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: 15,
								marginBottom: 4,
								...SCAPS,
							}}
						>
							THE ASTRONOMER'S ALMANAC
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: 34,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
							}}
						>
							CELESTIAL CHART
						</div>
						<div
							style={{
								display: "flex",
								height: 1.5,
								backgroundColor: "#000",
								marginTop: 5,
							}}
						/>
						{dateline ? (
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 15,
									paddingTop: 3,
									...SCAPS,
								}}
							>
								<div style={{ display: "flex" }}>{dateline}</div>
								<div style={{ display: "flex" }}>THE VISIBLE HEAVENS</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 4, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ============ CIRCULAR PLATE (the star chart) ============ */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{/* the lifted star chart, square so the disc stays round */}
							<div
								style={{
									display: "flex",
									height: plateBoxH,
									alignItems: "center",
									justifyContent: "center",
									width: "100%",
								}}
							>
								<svg
									width={chartSide}
									height={chartSide}
									viewBox={`0 0 ${S} ${S}`}
									preserveAspectRatio="xMidYMid meet"
									xmlns="http://www.w3.org/2000/svg"
									style={{ display: "block" }}
								>
									<title>Night Sky — local celestial chart</title>
									{/* Horizon circle (chart border) */}
									<circle
										cx={cx}
										cy={cy}
										r={R}
										fill="none"
										stroke="#000"
										strokeWidth={3}
									/>
									{/* Cardinal direction labels */}
									<g>
										{cardinals.map((c) => (
											<text
												key={c.label}
												x={c.x}
												y={c.y}
												fill="#000"
												fontSize={20}
												fontFamily="monospace"
												fontWeight="bold"
												textAnchor="middle"
												dominantBaseline="middle"
											>
												{c.label}
											</text>
										))}
									</g>
									{/* Constellation lines (both endpoints visible) */}
									{showLines ? (
										<g>
											{LINES.map(([a, b]) => {
												const pa = visible.get(a);
												const pb = visible.get(b);
												if (!pa || !pb) return null;
												return (
													<line
														key={`${a}-${b}`}
														x1={pa.x}
														y1={pa.y}
														x2={pb.x}
														y2={pb.y}
														stroke="#000"
														strokeWidth={2}
													/>
												);
											})}
										</g>
									) : null}
									{/* Stars */}
									<g>
										{stars.map((s) => (
											<circle
												key={s.name}
												cx={s.x}
												cy={s.y}
												r={s.r}
												fill="#000"
											/>
										))}
									</g>
								</svg>
							</div>
							{/* engraved caption carrying the coordinates + date */}
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "center",
									fontSize: 15,
									paddingTop: 4,
									...SCAPS,
								}}
							>
								{locLabel} · {dateline}
							</div>
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
							<div style={{ display: "flex" }}>
								{stars.length} STARS ABOVE THE HORIZON
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
