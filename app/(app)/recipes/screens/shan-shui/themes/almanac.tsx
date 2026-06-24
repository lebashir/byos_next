import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// SHAN-SHUI-ALMANAC — the generative ink-wash landscape mounted as a plate in
// a vintage broadsheet / Old Farmer's Almanac page.
//
// The art is the hero: the original Shan Shui PRNG + ridge/tree/water drawing
// is LIFTED VERBATIM into one inline <svg viewBox="0 0 800 480"> sized to the
// framed plate. Around it sits the almanac furniture — masthead, ruled plate
// with registration ticks, engraved caption, colophon.
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface ShanShuiAlmanacProps {
	width?: number;
	height?: number;
	params?: {
		seed?: number;
		layers?: number;
	};
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// The art's logical canvas (matches the original Shan Shui viewBox).
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
// Generative ink-wash drawing — the shared Shan Shui scene.
// mulberry32 PRNG + ridgeline midpoint displacement + hatch / pine / water.
// ===========================================================================

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

// Build the array of SVG children for the ink landscape from a seed + layers.
function buildLandscape(seed: number, layers: number): React.ReactElement[] {
	const rnd = mulberry32(seed || 1);
	const out: React.ReactElement[] = [];

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

	// Moon, drawn first so a back ridge can pass in front of it.
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

	// Ridges, back to front.
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

	// Pines on the foreground ridge.
	const frontRidge = ridges[frontIdx];
	const treeCount = 2 + Math.floor(rnd() * 3);
	for (let i = 0; i < treeCount; i++) {
		const px = 90 + (VW - 180) * ((i + 0.5 + (rnd() - 0.5) * 0.4) / treeCount);
		const gy = yAt(frontRidge.pts, px);
		const h = 30 + rnd() * 26;
		out.push(pine(px, gy + 2, h, `pine-${i}`));
	}

	// Calm water line.
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

	// Reflection dashes.
	const dashCount = 2 + Math.floor(rnd() * 2);
	for (let i = 0; i < dashCount; i++) {
		const dy = waterY + 12 + i * 12 + rnd() * 4;
		const dx = 120 + rnd() * (VW - 360);
		const dl = 60 + rnd() * 120;
		out.push(
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

	return out;
}

export default function ShanShuiAlmanac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: ShanShuiAlmanacProps) {
	const seed = Math.floor(params?.seed ?? 42);
	const layers = Math.max(2, Math.min(6, Math.floor(params?.layers ?? 4)));

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

	const art = buildLandscape(seed, layers);

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
							THE ALMANAC OF LANDSCAPES
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
							SHAN SHUI
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
								{/* the lifted generative ink landscape */}
								<svg
									width={artW}
									height={artH}
									viewBox={`0 0 ${VW} ${VH}`}
									preserveAspectRatio="xMidYMid meet"
									xmlns="http://www.w3.org/2000/svg"
									style={{ display: "block" }}
								>
									<title>Shan Shui — generative ink-wash landscape</title>
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
								SHAN SHUI · AN INK LANDSCAPE
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
							<div style={{ display: "flex" }}>{layers} RIDGES · FROM SEED</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
