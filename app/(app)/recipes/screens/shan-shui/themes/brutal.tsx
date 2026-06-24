import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface ShanShuiBrutalProps {
	width?: number;
	height?: number;
	params?: {
		seed?: number;
		layers?: number;
	};
}

// ---------------------------------------------------------------------------
// BRUTALIST / SWISS POSTER (white-dominant) framing of the Shan Shui ink-wash
// generator. The original generative drawing is LIFTED here verbatim (its
// mulberry32 PRNG + ridgeline/hatch/pine routines) and rendered into ONE inline
// <svg viewBox="0 0 800 480"> that fills the content area below a single black
// header bar carrying "SHAN SHUI" reversed out in white. Thick black rules
// frame the art; everything else is line work on white so the e-ink panel stays
// predominantly white and ghost-free.
// Pure #000 / #fff. Flexbox + inline SVG only — no grid, filter, gradient,
// shadow or opacity. SVG children are grouped in <g>, never React Fragments.
// ---------------------------------------------------------------------------

// Logical art canvas (matches the original Shan Shui viewBox).
const VW = 800;
const VH = 480;

/**
 * mulberry32 — small, fast, deterministic 32-bit PRNG.
 * Returns a function yielding floats in [0, 1).
 */
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

type Pt = { x: number; y: number };

/** Build one organic ridgeline across the full width. */
function ridgeline(
	rnd: () => number,
	baseY: number,
	amp: number,
	roughness: number,
	detail: number,
): Pt[] {
	const segs = 8;
	const phase1 = rnd() * Math.PI * 2;
	const phase2 = rnd() * Math.PI * 2;
	const phase3 = rnd() * Math.PI * 2;
	const f2 = 1.6 + rnd() * 0.9;
	const f3 = 2.7 + rnd() * 1.4;
	const tilt = (rnd() - 0.5) * amp * 0.5;

	let pts: Pt[] = [];
	for (let i = 0; i <= segs; i++) {
		const t = i / segs;
		const x = t * VW;
		const wave =
			Math.sin(t * Math.PI * 1 + phase1) * amp +
			Math.sin(t * Math.PI * f2 + phase2) * amp * 0.42 +
			Math.sin(t * Math.PI * f3 + phase3) * amp * 0.22;
		pts.push({ x, y: baseY - wave - tilt * t });
	}

	let range = amp * roughness;
	for (let pass = 0; pass < detail; pass++) {
		const next: Pt[] = [];
		for (let i = 0; i < pts.length - 1; i++) {
			const a = pts[i];
			const b = pts[i + 1];
			next.push(a);
			const mx = (a.x + b.x) / 2;
			const my = (a.y + b.y) / 2 + (rnd() - 0.5) * range;
			next.push({ x: mx, y: my });
		}
		next.push(pts[pts.length - 1]);
		pts = next;
		range *= 0.52;
	}
	return pts;
}

// Straight-segment polyline path (crisp at 1-bit).
function toPath(pts: Pt[]): string {
	return pts
		.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(" ");
}

// Interpolate the ridge's y at an arbitrary x.
function yAt(pts: Pt[], x: number): number {
	if (x <= pts[0].x) return pts[0].y;
	const last = pts[pts.length - 1];
	if (x >= last.x) return last.y;
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		if (x >= a.x && x <= b.x) {
			const f = (x - a.x) / (b.x - a.x || 1);
			return a.y + (b.y - a.y) * f;
		}
	}
	return last.y;
}

// Build the full set of lifted SVG art elements for the ink-mountain scene.
function buildScene(seed: number, layers: number): React.ReactElement[] {
	const rnd = mulberry32(seed || 1);
	const waterY = VH - 64;

	const moonR = 30 + rnd() * 12;
	const moonX = 150 + rnd() * 200;
	const moonY = 70 + rnd() * 30;

	type Ridge = { pts: Pt[]; baseY: number; stroke: number; index: number };
	const ridges: Ridge[] = [];
	const topBase = 132;
	const span = waterY - topBase;
	for (let i = 0; i < layers; i++) {
		const t = layers === 1 ? 0 : i / (layers - 1);
		const baseY = topBase + span * t;
		const amp = 26 + t * 64;
		const roughness = 0.5 + t * 0.55;
		const detail = 2 + Math.round(t * 2);
		const stroke = 1.6 + t * 2.2;
		ridges.push({
			pts: ridgeline(rnd, baseY, amp, roughness, detail),
			baseY,
			stroke,
			index: i,
		});
	}

	const frontIdx = layers - 1;
	const secondIdx = Math.max(0, layers - 2);

	const hatchFor = (
		ridge: Ridge,
		bottomY: number,
		step: number,
		lenMin: number,
		lenMax: number,
		w: number,
		key: string,
	) => {
		const lines: React.ReactElement[] = [];
		let n = 0;
		for (let x = 14; x < VW - 6; x += step) {
			const jitterX = x + (rnd() - 0.5) * step * 0.7;
			const top = yAt(ridge.pts, jitterX) + 3 + rnd() * 6;
			if (top >= bottomY - 4) continue;
			const len = lenMin + rnd() * (lenMax - lenMin);
			const y2 = Math.min(bottomY, top + len);
			const dx = (rnd() - 0.5) * 10;
			lines.push(
				<line
					key={`${key}-${n}`}
					x1={jitterX.toFixed(1)}
					y1={top.toFixed(1)}
					x2={(jitterX + dx).toFixed(1)}
					y2={y2.toFixed(1)}
					stroke="#000"
					strokeWidth={w}
					strokeLinecap="round"
				/>,
			);
			n++;
		}
		return <g key={`hatchg-${key}`}>{lines}</g>;
	};

	const pine = (x: number, groundY: number, h: number, key: string) => {
		const top = groundY - h;
		const tiers = 3 + Math.floor(rnd() * 2);
		const branches: React.ReactElement[] = [];
		for (let k = 0; k < tiers; k++) {
			const ty = top + (h * (k + 0.6)) / (tiers + 0.4);
			const bw = 5 + (h * 0.22 * (k + 1)) / tiers;
			const droop = bw * 0.45;
			branches.push(
				<line
					key={`${key}-l${k}`}
					x1={x}
					y1={ty}
					x2={x - bw}
					y2={ty + droop}
					stroke="#000"
					strokeWidth={1.6}
					strokeLinecap="round"
				/>,
				<line
					key={`${key}-r${k}`}
					x1={x}
					y1={ty}
					x2={x + bw}
					y2={ty + droop}
					stroke="#000"
					strokeWidth={1.6}
					strokeLinecap="round"
				/>,
			);
		}
		return (
			<g key={key}>
				<line
					x1={x}
					y1={groundY}
					x2={x}
					y2={top}
					stroke="#000"
					strokeWidth={1.8}
					strokeLinecap="round"
				/>
				{branches}
			</g>
		);
	};

	const frontRidge = ridges[frontIdx];
	const treeCount = 2 + Math.floor(rnd() * 3);
	const pines: React.ReactElement[] = [];
	for (let i = 0; i < treeCount; i++) {
		const px = 90 + (VW - 180) * ((i + 0.5 + (rnd() - 0.5) * 0.4) / treeCount);
		const gy = yAt(frontRidge.pts, px);
		const h = 30 + rnd() * 26;
		pines.push(pine(px, gy + 2, h, `pine-${i}`));
	}

	const dashCount = 2 + Math.floor(rnd() * 2);
	const dashes: React.ReactElement[] = [];
	for (let i = 0; i < dashCount; i++) {
		const dy = waterY + 12 + i * 12 + rnd() * 4;
		const dx = 120 + rnd() * (VW - 360);
		const dl = 60 + rnd() * 120;
		dashes.push(
			<line
				key={`refl-${i}`}
				x1={dx.toFixed(1)}
				y1={dy.toFixed(1)}
				x2={(dx + dl).toFixed(1)}
				y2={dy.toFixed(1)}
				stroke="#000"
				strokeWidth={1.6}
				strokeLinecap="round"
			/>,
		);
	}

	const out: React.ReactElement[] = [];

	out.push(
		<circle
			key="moon"
			cx={moonX.toFixed(1)}
			cy={moonY.toFixed(1)}
			r={moonR.toFixed(1)}
			fill="none"
			stroke="#000"
			strokeWidth={1.6}
		/>,
	);

	for (const r of ridges) {
		const isFront = r.index === frontIdx;
		const isSecond = r.index === secondIdx && layers >= 3;
		out.push(
			<g key={`ridge-${r.index}`}>
				{isFront ? hatchFor(r, waterY, 13, 16, 70, 1.6, "front") : null}
				{isSecond
					? hatchFor(r, ridges[frontIdx].baseY - 6, 24, 10, 34, 1.5, "second")
					: null}
				<path
					d={toPath(r.pts)}
					fill="none"
					stroke="#000"
					strokeWidth={r.stroke}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
			</g>,
		);
	}

	out.push(<g key="pines">{pines}</g>);

	out.push(
		<line
			key="water"
			x1={0}
			y1={waterY}
			x2={VW}
			y2={waterY}
			stroke="#000"
			strokeWidth={2}
			strokeLinecap="round"
		/>,
	);
	out.push(<g key="dashes">{dashes}</g>);

	return out;
}

export default function ShanShuiBrutal({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: ShanShuiBrutalProps) {
	const seed = Math.floor(params?.seed ?? 42);
	const layers = Math.max(2, Math.min(6, Math.floor(params?.layers ?? 4)));

	const elements = buildScene(seed, layers);

	const HEADER_H = 78;
	const RULE = 8;
	// Art fills the remaining content area below header + two thick rules.
	const artH = height - HEADER_H - RULE * 2;

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
					overflow: "hidden",
				}}
			>
				{/* ============ BLACK HEADER BAR (the main ink accent) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						height: HEADER_H,
						backgroundColor: "#000",
						paddingLeft: 22,
						paddingRight: 22,
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
							fontSize: 60,
							lineHeight: 1,
							letterSpacing: -1,
							overflow: "hidden",
						}}
					>
						SHAN SHUI
					</div>
				</div>

				{/* thick rule under the header block */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== LIFTED ART (on white) ===================== */}
				<div
					style={{
						display: "flex",
						width,
						height: artH,
						backgroundColor: "#fff",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					<svg
						width={width}
						height={artH}
						viewBox={`0 0 ${VW} ${VH}`}
						preserveAspectRatio="none"
						xmlns="http://www.w3.org/2000/svg"
						style={{ display: "block", backgroundColor: "#fff" }}
					>
						<title>Shan Shui — generative ink-wash landscape (brutalist)</title>
						{elements}
					</svg>
				</div>

				{/* thick rule along the foot */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />
			</div>
		</PreSatori>
	);
}
