import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

type NightSkyParams = {
	lat: number;
	lon: number;
	showLines: boolean;
};

interface NightSkyMacProps {
	width?: number;
	height?: number;
	params: NightSkyParams;
}

// ===========================================================================
// Night Sky (Mac) — the local star chart (catalog + projection math lifted
// VERBATIM from ../night-sky/night-sky) drawn into an inline SVG that fills
// the content area of a 1984 Macintosh window: drag-stripe title bar, hollow
// close box, 1px border, hard 2px black drop shadow, on a checkerboard
// desktop, with a window status strip showing LAT / LON. Pure #000 / #fff.
// Flexbox + inline SVG only (Takumi-safe — no grid, filter, gradient, shadow,
// opacity). SVG children use <g>, never Fragments.
// ===========================================================================

// Bundled star catalog: name, right ascension (hours 0-24), declination (deg),
// apparent magnitude. Approximate real values — used to compute the local sky
// at render time. No network access.
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

// Constellation line segments referenced by catalog star name. A segment is
// only drawn when BOTH endpoints are above the horizon.
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

function buildChart(params: NightSkyParams, cx: number, cy: number, R: number) {
	const { lat, lon } = params;

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
// Title-bar drag stripes: the classic six horizontal lines of an active Mac
// window title bar. Inline SVG <line>s so they render crisply.
// ---------------------------------------------------------------------------
function DragStripes({ width, height }: { width: number; height: number }) {
	const lines = 6;
	const top = 4;
	const bottom = height - 4;
	const span = bottom - top;
	const step = span / (lines - 1);
	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>title bar</title>
			{Array.from({ length: lines }).map((_, i) => {
				const y = top + step * i;
				return (
					<line
						key={`stripe-${i}`}
						x1={0}
						y1={y}
						x2={width}
						y2={y}
						stroke="#000"
						strokeWidth={2}
					/>
				);
			})}
		</svg>
	);
}

// The hollow square "close box" at the far left of the title bar.
function CloseBox({ s }: { s: number }) {
	return (
		<svg
			width={s}
			height={s}
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>close</title>
			<rect
				x="2"
				y="2"
				width="16"
				height="16"
				fill="#fff"
				stroke="#000"
				strokeWidth="2"
			/>
		</svg>
	);
}

export default function NightSkyMac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: NightSkyMacProps) {
	const { lat, lon, showLines } = params;

	// --- Desktop / window geometry. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const BORDER = 2;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;
	const STATUS_H = 24;
	// The window content area sits inside the 2px window border, between the
	// title bar and the status strip. Compute explicit pixel dimensions for
	// the art SVG: under the takumi renderer an inline <svg> with percentage
	// sizing in a flex container collapses to zero, so the art must be sized
	// in real pixels and its parent given a fixed height.
	const CONTENT_W = winW - BORDER * 2;
	const CONTENT_H = winH - BORDER * 2 - TITLE_H - STATUS_H;

	// Internal art coordinate space for the chart — a SQUARE so the circular
	// horizon stays a true circle. The SVG is sized to the content box in real
	// pixels and the viewBox (with xMidYMid meet) letterboxes this square to
	// fit; the projection math (lifted verbatim) runs against THIS space.
	const ART_SIZE = 340;
	const ART_W = ART_SIZE;
	const ART_H = ART_SIZE;

	const PAD = 30;
	const R = (ART_H - 2 * PAD) / 2;
	const cx = ART_W / 2;
	const cy = PAD + R;

	const visible = buildChart(params, cx, cy, R);
	const stars = Array.from(visible.values());

	const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
	const locLabel = `LAT ${fmt(lat)}   LON ${fmt(lon)}`;

	const now = new Date();
	let dateLabel: string;
	try {
		dateLabel = new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(now);
	} catch {
		dateLabel = now.toISOString();
	}

	// Cardinal label positions (sky chart looking up: East is on the LEFT).
	const cardinals: { label: string; x: number; y: number }[] = [
		{ label: "N", x: cx, y: cy - R - 16 },
		{ label: "S", x: cx, y: cy + R + 16 },
		{ label: "E", x: cx - R - 16, y: cy },
		{ label: "W", x: cx + R + 16, y: cy },
	];

	// The lifted star chart, drawn into one SVG sized (in real pixels) to the
	// window content area. The square viewBox + xMidYMid meet keeps the
	// horizon a true circle, centered within the content box.
	const artSvg = (
		<svg
			width={CONTENT_W}
			height={CONTENT_H}
			viewBox={`0 0 ${ART_W} ${ART_H}`}
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
			style={{ display: "block", backgroundColor: "#fff" }}
		>
			<title>Night Sky star chart</title>
			{/* Paper background */}
			<rect x={0} y={0} width={ART_W} height={ART_H} fill="#fff" />

			{/* Horizon circle (chart border) */}
			<circle cx={cx} cy={cy} r={R} fill="none" stroke="#000" strokeWidth={3} />

			{/* Cardinal direction labels */}
			<g>
				{cardinals.map((c) => (
					<text
						key={c.label}
						className="font-geneva9"
						x={c.x}
						y={c.y}
						fill="#000"
						fontSize={20}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						{c.label}
					</text>
				))}
			</g>

			{/* Constellation lines (only when both endpoints are visible) */}
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
					<circle key={s.name} cx={s.x} cy={s.y} r={s.r} fill="#000" />
				))}
			</g>
		</svg>
	);

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black"
				style={{
					position: "relative",
					display: "flex",
					width,
					height,
					boxSizing: "border-box",
					padding: MARGIN,
				}}
			>
				{/* Desktop dither — 50% checkerboard (2px cells) behind everything. */}
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{ position: "absolute", top: 0, left: 0 }}
				>
					<title>desktop</title>
					<defs>
						<pattern
							id="nsDeskDither"
							width="4"
							height="4"
							patternUnits="userSpaceOnUse"
						>
							<rect x="0" y="0" width="4" height="4" fill="#fff" />
							<rect x="0" y="0" width="2" height="2" fill="#000" />
							<rect x="2" y="2" width="2" height="2" fill="#000" />
						</pattern>
					</defs>
					<rect
						x="0"
						y="0"
						width={width}
						height={height}
						fill="url(#nsDeskDither)"
					/>
				</svg>

				{/* Hard drop shadow: a solid black rectangle offset down-right. */}
				<div
					style={{
						position: "absolute",
						top: MARGIN + SHADOW,
						left: MARGIN + SHADOW,
						width: winW,
						height: winH,
						backgroundColor: "#000",
						display: "flex",
					}}
				/>

				{/* The window shell. */}
				<div
					style={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						width: winW,
						height: winH,
						backgroundColor: "#fff",
						border: "2px solid #000",
						boxSizing: "border-box",
					}}
				>
					{/* Title bar: close box · stripes · centered title · stripes. */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							height: TITLE_H,
							borderBottom: "2px solid #000",
							padding: "0 6px",
							flexShrink: 0,
						}}
					>
						<div
							style={{ display: "flex", alignItems: "center", marginRight: 6 }}
						>
							<CloseBox s={14} />
						</div>
						<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
							<DragStripes
								width={Math.max(10, Math.floor(winW * 0.34))}
								height={TITLE_H}
							/>
						</div>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								backgroundColor: "#fff",
								padding: "0 10px",
								fontSize: 16,
								height: TITLE_H - 4,
								whiteSpace: "nowrap",
							}}
						>
							Night Sky
						</div>
						<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
							<DragStripes
								width={Math.max(10, Math.floor(winW * 0.34))}
								height={TITLE_H}
							/>
						</div>
						<div style={{ width: 14 + 6, display: "flex" }} />
					</div>

					{/* Window content area — fixed pixel height so the inline chart
						SVG has a real box to fill (flex:1 alone collapses it). */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: CONTENT_W,
							height: CONTENT_H,
							boxSizing: "border-box",
							backgroundColor: "#fff",
						}}
					>
						{artSvg}
					</div>

					{/* Window status strip — LAT / LON + capture time. */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							height: STATUS_H,
							borderTop: "2px solid #000",
							padding: "0 10px",
							flexShrink: 0,
							backgroundColor: "#fff",
						}}
					>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 16,
								whiteSpace: "nowrap",
							}}
						>
							{locLabel}
						</div>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 16,
								whiteSpace: "nowrap",
							}}
						>
							{dateLabel}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
