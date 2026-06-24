import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

type TrianglesParams = { seed: number; density: number };

interface TrianglesMacProps {
	width?: number;
	height?: number;
	params: TrianglesParams;
}

// ===========================================================================
// Triangles (Mac) — the generative low-poly / kumiko triangle art (lifted
// verbatim from ../triangles/triangles) drawn into an inline SVG that fills
// the content area of a 1984 Macintosh window: drag-stripe title bar, hollow
// close box, 1px border, hard 2px black drop shadow, on a checkerboard
// desktop. Pure #000 / #fff. Flexbox + inline SVG only (Takumi-safe — no
// grid, filter, gradient, shadow, opacity). SVG children use <g>, never
// Fragments.
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

export default function TrianglesMac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: TrianglesMacProps) {
	// Logical art canvas. The art SVG scales to the window content via viewBox.
	const W = 800;
	const H = 480;
	const seed = Math.floor(params.seed) || 0;
	const depth = Math.min(7, Math.max(3, Math.floor(params.density)));
	const rand = mulberry32(seed + 1);

	// --- Desktop / window geometry. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const BORDER = 2;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;
	// The window content area sits inside the 2px window border, below the
	// title bar (which has its own 2px bottom border). Compute explicit pixel
	// dimensions for the art SVG: under the takumi renderer an inline <svg>
	// with percentage sizing in a flex container collapses to zero, so the art
	// must be sized in real pixels and its parent given a fixed height.
	const CONTENT_W = winW - BORDER * 2;
	const CONTENT_H = winH - BORDER * 2 - TITLE_H;

	// ----- Lifted triangle generation (verbatim from triangles). -----
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

	const elements: React.ReactNode[] = [];

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

	// The lifted art, drawn into one SVG sized (in real pixels) to the window
	// content area. The viewBox maps the WxH generation space onto it.
	const artSvg = (
		<svg
			width={CONTENT_W}
			height={CONTENT_H}
			viewBox={`0 0 ${W} ${H}`}
			preserveAspectRatio="none"
			xmlns="http://www.w3.org/2000/svg"
			style={{ display: "block", backgroundColor: "#fff" }}
		>
			<title>Triangles</title>
			<rect x={0} y={0} width={W} height={H} fill="#fff" />
			<g>{elements}</g>
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
							id="triDeskDither"
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
						fill="url(#triDeskDither)"
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
							Triangles
						</div>
						<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
							<DragStripes
								width={Math.max(10, Math.floor(winW * 0.34))}
								height={TITLE_H}
							/>
						</div>
						<div style={{ width: 14 + 6, display: "flex" }} />
					</div>

					{/* Window content area — fixed pixel height so the inline art
						SVG has a real box to fill (flex:1 alone collapses it). */}
					<div
						style={{
							display: "flex",
							width: CONTENT_W,
							height: CONTENT_H,
							boxSizing: "border-box",
							backgroundColor: "#fff",
						}}
					>
						{artSvg}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
