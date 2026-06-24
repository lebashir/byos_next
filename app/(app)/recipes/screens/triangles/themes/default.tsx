import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

type TrianglesParams = { seed: number; density: number };

interface TrianglesProps {
	width?: number;
	height?: number;
	params: TrianglesParams;
}

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

export default function Triangles({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: TrianglesProps) {
	const W = 800;
	const H = 480;
	const seed = Math.floor(params.seed) || 0;
	const depth = Math.min(7, Math.max(3, Math.floor(params.density)));
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

	return (
		<PreSatori width={width} height={height}>
			<div
				style={{
					display: "flex",
					width,
					height,
					backgroundColor: "#fff",
				}}
			>
				<svg
					width={width}
					height={height}
					viewBox="0 0 800 480"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Triangles</title>
					<rect x={0} y={0} width={W} height={H} fill="#fff" />
					{elements}
					<rect
						x={1}
						y={1}
						width={W - 2}
						height={H - 2}
						fill="none"
						stroke="#000"
						strokeWidth={2}
					/>
				</svg>
			</div>
		</PreSatori>
	);
}
