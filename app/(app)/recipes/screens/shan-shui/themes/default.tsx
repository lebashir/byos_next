import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface ShanShuiProps {
	width?: number;
	height?: number;
	params?: {
		seed?: number;
		layers?: number;
	};
}

// Logical canvas. The SVG scales to width x height via the viewBox.
const VW = 800;
const VH = 480;

/**
 * mulberry32 — small, fast, deterministic 32-bit PRNG.
 * Returns a function yielding floats in [0, 1). All randomness in this scene
 * derives from a single seed so the same seed always paints the same picture.
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

/**
 * Build one organic ridgeline across the full width.
 *
 * Combines a few summed sine waves (rolling silhouette) with recursive
 * midpoint displacement (jagged, fractal peaks). `roughness` controls how
 * far midpoints can stray; `detail` controls the subdivision depth, so front
 * ridges can carry more crags than distant ones.
 */
function ridgeline(
	rnd: () => number,
	baseY: number,
	amp: number,
	roughness: number,
	detail: number,
): Pt[] {
	// Low-frequency backbone from summed sines with seeded phases.
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

	// Recursive midpoint displacement adds fractal crags between backbone pts.
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
		range *= 0.52; // diminish with each finer pass
	}
	return pts;
}

// Smooth-ish polyline path string (straight segments read crisply at 1-bit).
function toPath(pts: Pt[]): string {
	return pts
		.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(" ");
}

// Interpolate the ridge's y at an arbitrary x (for placing trees / clipping).
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

export default function ShanShui({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: ShanShuiProps) {
	const seed = Math.floor(params?.seed ?? 42);
	const layers = Math.max(2, Math.min(6, Math.floor(params?.layers ?? 4)));
	const rnd = mulberry32(seed || 1);

	const waterY = VH - 64; // calm horizon near the bottom

	// Moon: a single thin circle high up, later tucked behind the back ridge.
	const moonR = 30 + rnd() * 12;
	const moonX = 150 + rnd() * 200;
	const moonY = 70 + rnd() * 30;

	// Build ridges from BACK (high, small amplitude) to FRONT (low, tall, jagged).
	// Their base lines march down the canvas; amplitude and detail grow forward.
	type Ridge = { pts: Pt[]; baseY: number; stroke: number; index: number };
	const ridges: Ridge[] = [];
	const topBase = 132;
	const span = waterY - topBase;
	for (let i = 0; i < layers; i++) {
		const t = layers === 1 ? 0 : i / (layers - 1); // 0 = back, 1 = front
		const baseY = topBase + span * t;
		const amp = 26 + t * 64; // distant ridges roll gently; near ones tower
		const roughness = 0.5 + t * 0.55;
		const detail = 2 + Math.round(t * 2); // 2..4 subdivision passes
		const stroke = 1.6 + t * 2.2; // 1.6px back -> ~3.8px front
		ridges.push({
			pts: ridgeline(rnd, baseY, amp, roughness, detail),
			baseY,
			stroke,
			index: i,
		});
	}

	const frontIdx = layers - 1;
	const secondIdx = Math.max(0, layers - 2);

	/**
	 * Sparse hatching to suggest a rock face under a ridge. Strokes are pure
	 * #000 lines (never gray fills); denser spacing reads as a darker mountain.
	 * Each stroke starts on the ridge and rakes down-left a short, varied length.
	 */
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
			const dx = (rnd() - 0.5) * 10; // slight diagonal rake
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

	/**
	 * A spare pine: vertical trunk plus a few upward-angled branch pairs that
	 * shorten toward the tip. Placed sitting on a ridgeline.
	 */
	const pine = (x: number, groundY: number, h: number, key: string) => {
		const top = groundY - h;
		const tiers = 3 + Math.floor(rnd() * 2);
		const branches: React.ReactElement[] = [];
		for (let k = 0; k < tiers; k++) {
			const ty = top + (h * (k + 0.6)) / (tiers + 0.4);
			const bw = 5 + (h * 0.22 * (k + 1)) / tiers; // wider toward the base
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

	// Place 2-4 pines along the frontmost ridge, spread across the width.
	const frontRidge = ridges[frontIdx];
	const treeCount = 2 + Math.floor(rnd() * 3); // 2..4
	const pines: React.ReactElement[] = [];
	for (let i = 0; i < treeCount; i++) {
		const px = 90 + (VW - 180) * ((i + 0.5 + (rnd() - 0.5) * 0.4) / treeCount);
		const gy = yAt(frontRidge.pts, px);
		const h = 30 + rnd() * 26;
		pines.push(pine(px, gy + 2, h, `pine-${i}`));
	}

	// Short horizontal reflection dashes resting just below the water line.
	const dashCount = 2 + Math.floor(rnd() * 2); // 2..3
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
					viewBox={`0 0 ${VW} ${VH}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{ display: "block", backgroundColor: "#fff" }}
				>
					<title>Shan Shui — generative ink-wash landscape</title>

					{/* Moon outline, drawn first so a back ridge can pass in front of it. */}
					<circle
						cx={moonX.toFixed(1)}
						cy={moonY.toFixed(1)}
						r={moonR.toFixed(1)}
						fill="none"
						stroke="#000"
						strokeWidth={1.6}
					/>

					{/* Ridges, back to front. Distant ones are bare outlines; the front
					    two carry hatching to read as solid, nearer rock. */}
					{ridges.map((r) => {
						const isFront = r.index === frontIdx;
						const isSecond = r.index === secondIdx && layers >= 3;
						return (
							<g key={`ridge-${r.index}`}>
								{isFront ? hatchFor(r, waterY, 13, 16, 70, 1.6, "front") : null}
								{isSecond
									? hatchFor(
											r,
											ridges[frontIdx].baseY - 6,
											24,
											10,
											34,
											1.5,
											"second",
										)
									: null}
								<path
									d={toPath(r.pts)}
									fill="none"
									stroke="#000"
									strokeWidth={r.stroke}
									strokeLinejoin="round"
									strokeLinecap="round"
								/>
							</g>
						);
					})}

					{/* Pines perched on the foreground ridge. */}
					{pines}

					{/* Calm water line + a few reflection dashes. */}
					<line
						x1={0}
						y1={waterY}
						x2={VW}
						y2={waterY}
						stroke="#000"
						strokeWidth={2}
						strokeLinecap="round"
					/>
					{dashes}
				</svg>
			</div>
		</PreSatori>
	);
}
