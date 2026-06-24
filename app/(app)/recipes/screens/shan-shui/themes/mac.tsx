import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface ShanShuiMacProps {
	width?: number;
	height?: number;
	params?: {
		seed?: number;
		layers?: number;
	};
}

// ===========================================================================
// Shan Shui (Mac) — the shared generative ink-wash landscape drawn into an
// inline SVG that fills the content area
// of a 1984 Macintosh window: drag-stripe title bar, hollow close box, 1px
// border, hard 2px black drop shadow, on a checkerboard desktop. Pure #000 /
// #fff. Flexbox + inline SVG only (Takumi-safe — no grid, filter, gradient,
// shadow, opacity). SVG children use <g>, never Fragments.
// ===========================================================================

// Logical art canvas. The art SVG scales to the window content via the viewBox.
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
 */
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

function toPath(pts: Pt[]): string {
	return pts
		.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(" ");
}

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

export default function ShanShuiMac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: ShanShuiMacProps) {
	const seed = Math.floor(params?.seed ?? 42);
	const layers = Math.max(2, Math.min(6, Math.floor(params?.layers ?? 4)));
	const rnd = mulberry32(seed || 1);

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

	// ----- Lifted ink-mountain generation (verbatim from shan-shui). -----
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

	// The lifted art, drawn into one SVG sized (in real pixels) to the window
	// content area. The viewBox maps the VWxVH generation space onto it.
	const artSvg = (
		<svg
			width={CONTENT_W}
			height={CONTENT_H}
			viewBox={`0 0 ${VW} ${VH}`}
			preserveAspectRatio="none"
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

			{/* Ridges, back to front. */}
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
			<g>{pines}</g>

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
			<g>{dashes}</g>
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
							id="ssDeskDither"
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
						fill="url(#ssDeskDither)"
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
							Shan Shui
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
