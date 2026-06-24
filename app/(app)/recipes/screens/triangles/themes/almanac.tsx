import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// TRIANGLES-ALMANAC — the generative triangle-subdivision tessellation mounted
// as a plate in a vintage broadsheet / Old Farmer's Almanac page.
//
// The art is the hero: the original Triangles PRNG + recursive subdivision +
// diagonal hatch-fill drawing is LIFTED VERBATIM into one inline
// <svg viewBox="0 0 800 480"> sized to the framed plate. Around it sits the
// almanac furniture — masthead, ruled plate with registration ticks, engraved
// caption, colophon.
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface TrianglesAlmanacProps {
	width?: number;
	height?: number;
	params?: {
		seed?: number;
		density?: number;
	};
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// The art's logical canvas (matches the original Triangles viewBox).
const VW = 800;
const VH = 480;

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

// Corner ticks for the specimen plate — small engraving-style registration marks.
function PlateCorners() {
	const L = 14;
	const corner = (
		x: number,
		y: number,
		dx: number,
		dy: number,
		key: string,
	) => (
		<g key={key} stroke="#000" strokeWidth={2}>
			<line x1={x} y1={y} x2={x + dx * L} y2={y} />
			<line x1={x} y1={y} x2={x} y2={y + dy * L} />
		</g>
	);
	return (
		<svg
			width="100%"
			height="100%"
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			xmlns="http://www.w3.org/2000/svg"
			style={{ display: "flex" }}
		>
			<title>plate corners</title>
			<g>
				{corner(2, 2, 1, 1, "tl")}
				{corner(98, 2, -1, 1, "tr")}
				{corner(2, 98, 1, -1, "bl")}
				{corner(98, 98, -1, -1, "br")}
			</g>
		</svg>
	);
}

// ===========================================================================
// Generative geometry lifted VERBATIM from ../triangles/triangles.
// mulberry32 PRNG + longest-edge subdivision + per-triangle hatch / solid fill.
// ===========================================================================

type Point = [number, number];

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const mid = (a: Point, b: Point): Point => [
	(a[0] + b[0]) / 2,
	(a[1] + b[1]) / 2,
];

interface Tri {
	pts: [Point, Point, Point];
}

function subdivide(
	tri: Tri,
	depth: number,
	maxDepth: number,
	rand: () => number,
	out: Tri[],
) {
	const stopChance = depth >= 2 ? 0.18 + depth * 0.05 : 0;
	if (depth >= maxDepth || (depth >= 2 && rand() < stopChance)) {
		out.push(tri);
		return;
	}

	const [a, b, c] = tri.pts;
	const ab = dist(a, b);
	const bc = dist(b, c);
	const ca = dist(c, a);

	let m: Point;
	let t1: Tri;
	let t2: Tri;
	if (ab >= bc && ab >= ca) {
		m = mid(a, b);
		t1 = { pts: [a, m, c] };
		t2 = { pts: [m, b, c] };
	} else if (bc >= ab && bc >= ca) {
		m = mid(b, c);
		t1 = { pts: [b, m, a] };
		t2 = { pts: [m, c, a] };
	} else {
		m = mid(c, a);
		t1 = { pts: [c, m, b] };
		t2 = { pts: [m, a, b] };
	}

	subdivide(t1, depth + 1, maxDepth, rand, out);
	subdivide(t2, depth + 1, maxDepth, rand, out);
}

function centroid(tri: Tri): Point {
	const [a, b, c] = tri.pts;
	return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
}

function hatchLines(tri: Tri, spacing: number, rand: () => number): string[] {
	const xs = tri.pts.map((p) => p[0]);
	const ys = tri.pts.map((p) => p[1]);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	const diagonal = rand() < 0.5 ? 1 : -1;
	const lines: string[] = [];
	const span = maxX - minX + (maxY - minY);
	const start = diagonal === 1 ? minX - (maxY - minY) : minX;

	for (let o = 0; o <= span; o += spacing) {
		const x0 = start + o;
		const p0: Point = [x0, minY];
		const p1: Point = [x0 + diagonal * (maxY - minY), maxY];
		const clipped = clipSegmentToTri(p0, p1, tri);
		if (clipped) {
			lines.push(
				`M ${clipped[0][0].toFixed(1)} ${clipped[0][1].toFixed(1)} L ${clipped[1][0].toFixed(1)} ${clipped[1][1].toFixed(1)}`,
			);
		}
	}
	return lines;
}

function sign(p: Point, a: Point, b: Point) {
	return (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
}

function pointInTri(p: Point, tri: Tri) {
	const [a, b, c] = tri.pts;
	const d1 = sign(p, a, b);
	const d2 = sign(p, b, c);
	const d3 = sign(p, c, a);
	const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
	return !(hasNeg && hasPos);
}

function segIntersect(
	p1: Point,
	p2: Point,
	p3: Point,
	p4: Point,
): Point | null {
	const d =
		(p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
	if (Math.abs(d) < 1e-9) return null;
	const t =
		((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
	const u =
		((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
	if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
		return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
	}
	return null;
}

function clipSegmentToTri(
	p0: Point,
	p1: Point,
	tri: Tri,
): [Point, Point] | null {
	const hits: Point[] = [];
	const [a, b, c] = tri.pts;
	const edges: [Point, Point][] = [
		[a, b],
		[b, c],
		[c, a],
	];
	for (const [e0, e1] of edges) {
		const hit = segIntersect(p0, p1, e0, e1);
		if (hit) hits.push(hit);
	}
	if (pointInTri(p0, tri)) hits.push(p0);
	if (pointInTri(p1, tri)) hits.push(p1);
	if (hits.length < 2) return null;

	let best: [Point, Point] = [hits[0], hits[1]];
	let bestLen = dist(hits[0], hits[1]);
	for (let i = 0; i < hits.length; i++) {
		for (let j = i + 1; j < hits.length; j++) {
			const l = dist(hits[i], hits[j]);
			if (l > bestLen) {
				bestLen = l;
				best = [hits[i], hits[j]];
			}
		}
	}
	if (bestLen < 1) return null;
	return best;
}

const triPoints = (tri: Tri) =>
	tri.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

// Build the array of SVG children for the tessellation from a seed + density.
function buildTriangles(seed: number, depth: number): React.ReactElement[] {
	const W = VW;
	const H = VH;
	const rand = mulberry32(seed + 1);

	const corners: { tl: Point; tr: Point; br: Point; bl: Point } = {
		tl: [0, 0],
		tr: [W, 0],
		br: [W, H],
		bl: [0, H],
	};

	const seeds: Tri[] =
		rand() < 0.5
			? [
					{ pts: [corners.tl, corners.tr, corners.br] },
					{ pts: [corners.tl, corners.br, corners.bl] },
				]
			: [
					{ pts: [corners.tr, corners.br, corners.bl] },
					{ pts: [corners.tr, corners.bl, corners.tl] },
				];

	const tris: Tri[] = [];
	for (const s of seeds) {
		subdivide(s, 0, depth, rand, tris);
	}

	const solidBudget = Math.floor(tris.length * 0.12);
	let solidUsed = 0;

	const elements: React.ReactElement[] = [];

	for (let i = 0; i < tris.length; i++) {
		const tri = tris[i];
		const roll = rand();
		let mode: "white" | "hatch" | "solid";
		if (roll < 0.55) {
			mode = "white";
		} else if (roll < 0.92) {
			mode = "hatch";
		} else if (solidUsed < solidBudget) {
			mode = "solid";
			solidUsed += 1;
		} else {
			mode = "hatch";
		}

		const pointsStr = triPoints(tri);

		if (mode === "solid") {
			elements.push(
				<polygon
					key={`s${i}`}
					points={pointsStr}
					fill="#000"
					stroke="#000"
					strokeWidth={2}
					strokeLinejoin="miter"
				/>,
			);
			continue;
		}

		if (mode === "hatch") {
			const c = centroid(tri);
			const spacing = 4 + Math.floor(rand() * 7);
			const area = Math.abs(
				(tri.pts[1][0] - tri.pts[0][0]) * (tri.pts[2][1] - tri.pts[0][1]) -
					(tri.pts[2][0] - tri.pts[0][0]) * (tri.pts[1][1] - tri.pts[0][1]),
			);
			if (area > 120) {
				const lines = hatchLines(tri, spacing, rand);
				elements.push(
					<g key={`h${i}`}>
						<path
							d={lines.join(" ")}
							stroke="#000"
							strokeWidth={2}
							fill="none"
						/>
						<polygon
							points={pointsStr}
							fill="none"
							stroke="#000"
							strokeWidth={2}
							strokeLinejoin="miter"
						/>
					</g>,
				);
				void c;
				continue;
			}
		}

		elements.push(
			<polygon
				key={`w${i}`}
				points={pointsStr}
				fill="none"
				stroke="#000"
				strokeWidth={2}
				strokeLinejoin="miter"
			/>,
		);
	}

	return elements;
}

export default function TrianglesAlmanac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: TrianglesAlmanacProps) {
	const seed = Math.floor(params?.seed ?? 7) || 0;
	const depth = Math.min(7, Math.max(3, Math.floor(params?.density ?? 5)));

	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;
	const dateline = todayLabel();

	// Fixed pixel box for the framed art plate. Under takumi an inline <svg>
	// with percentage dimensions inside a flex:1 parent collapses to zero, so we
	// size the plate explicitly: total height minus the masthead / dateline /
	// ornament / caption / colophon chrome above and below it.
	const CHROME_H = 232;
	const plateBoxH = Math.max(120, height - CHROME_H);
	const PLATE_BORDER = 1.5;
	const PLATE_PAD = 6;
	// The art <svg> sits inside the plate's border + padding.
	const artW = Math.max(40, contentW - (PLATE_BORDER + PLATE_PAD) * 2);
	const artH = Math.max(40, plateBoxH - (PLATE_BORDER + PLATE_PAD) * 2);

	const art = buildTriangles(seed, depth);

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
							THE ALMANAC OF FIGURES
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: 36,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
							}}
						>
							TESSELLATION
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
								<div style={{ display: "flex" }}>PLATE No. {seed}</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 4, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== PLATE (the art) ===================== */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
							}}
						>
							<div
								style={{
									display: "flex",
									width: contentW,
									height: plateBoxH,
									border: `${PLATE_BORDER}px solid #000`,
									boxSizing: "border-box",
									padding: PLATE_PAD,
									position: "relative",
								}}
							>
								{/* registration corner ticks */}
								<div
									style={{
										display: "flex",
										position: "absolute",
										top: 4,
										left: 4,
										right: 4,
										bottom: 4,
									}}
								>
									<PlateCorners />
								</div>
								{/* the lifted generative tessellation */}
								<svg
									width={artW}
									height={artH}
									viewBox={`0 0 ${VW} ${VH}`}
									preserveAspectRatio="xMidYMid meet"
									xmlns="http://www.w3.org/2000/svg"
									style={{ display: "block" }}
								>
									<title>Triangles — generative tessellation</title>
									<g>{art}</g>
								</svg>
							</div>
							{/* engraved caption */}
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "center",
									fontSize: 15,
									paddingTop: 5,
									...SCAPS,
								}}
							>
								TESSELLATION · PLATE OF TRIANGLES
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
							<div style={{ display: "flex" }}>DEPTH {depth} · SUBDIVIDED</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
