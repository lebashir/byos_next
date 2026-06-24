import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// Who's That Pokémon? (Mac) — the silhouette guessing game restyled as a 1984
// Macintosh dialog window: a chrome window on the dithered desktop, the black
// silhouette framed in an inset "well", and the answer revealed on a chunky
// Mac push-button. Pure #000 / #fff. Flexbox + inline SVG only (Takumi-safe).
// The sprite is ALREADY a solid-black silhouette data URL — drawn <img> as-is
// (no CSS filter, which the renderer ignores). SVG children use <g>, never <>.
// ===========================================================================

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

interface WtpMacProps {
	name?: string;
	number?: string;
	spriteUrl?: string;
	reveal?: boolean;
	message?: string;
	width?: number;
	height?: number;
}

export default function WtpMac({
	name = "",
	number = "",
	spriteUrl = "",
	reveal = true,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WtpMacProps) {
	// --- Desktop geometry: window floats on the dithered desktop with a hard
	// 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;

	const Shell = ({ children }: { children: React.ReactNode }) => (
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
						id="wtpDeskDither"
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
					fill="url(#wtpDeskDither)"
				/>
			</svg>

			{/* Hard drop shadow. */}
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

			{/* Window shell. */}
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
							width={Math.max(10, Math.floor(winW * 0.22))}
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
						Who's That Pokémon?
					</div>
					<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
						<DragStripes
							width={Math.max(10, Math.floor(winW * 0.22))}
							height={TITLE_H}
						/>
					</div>
					<div style={{ width: 14 + 6, display: "flex" }} />
				</div>

				{children}
			</div>
		</div>
	);

	// --- Error / empty state: message centered inside the window. ---
	if (message) {
		return (
			<PreSatori width={width} height={height}>
				<Shell>
					<div
						className="font-geneva9"
						style={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: 30,
							textAlign: "center",
							fontSize: 22,
							backgroundColor: "#fff",
						}}
					>
						{message}
					</div>
				</Shell>
			</PreSatori>
		);
	}

	return (
		<PreSatori width={width} height={height}>
			<Shell>
				{/* Window content — dialog body. */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						alignItems: "center",
						padding: "12px 16px 14px",
						boxSizing: "border-box",
						backgroundColor: "#fff",
					}}
				>
					{/* Prompt line. */}
					<div
						className="font-geneva9"
						style={{
							display: "flex",
							fontSize: 20,
							marginBottom: 10,
							textAlign: "center",
						}}
					>
						Can you name this Pokémon?
					</div>

					{/* Silhouette well — an inset framed icon box on the desktop. */}
					<div
						style={{
							display: "flex",
							flex: 1,
							width: 300,
							alignItems: "center",
							justifyContent: "center",
							border: "2px solid #000",
							backgroundColor: "#fff",
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						{spriteUrl ? (
							<img
								src={spriteUrl}
								alt="Silhouette"
								width={250}
								height={250}
								style={{
									width: 250,
									height: 250,
									objectFit: "contain",
									imageRendering: "pixelated",
								}}
							/>
						) : null}
					</div>

					{/* The answer on a chunky Mac push-button (default button = a
					    bold double-framed button). When hidden, a big "?" button. */}
					<div
						style={{
							display: "flex",
							marginTop: 12,
							justifyContent: "center",
						}}
					>
						{reveal ? (
							<div
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									border: "3px solid #000",
									padding: "5px 18px",
									backgroundColor: "#fff",
								}}
							>
								<div
									className="font-blockKie"
									style={{ display: "flex", fontSize: 26 }}
								>
									IT'S {name.toUpperCase()}!
								</div>
								<div
									className="font-geneva9"
									style={{ display: "flex", fontSize: 16, marginLeft: 12 }}
								>
									{number}
								</div>
							</div>
						) : (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									border: "3px solid #000",
									backgroundColor: "#fff",
									width: 56,
									height: 44,
								}}
							>
								<div
									className="font-blockKie"
									style={{ display: "flex", fontSize: 30 }}
								>
									?
								</div>
							</div>
						)}
					</div>
				</div>
			</Shell>
		</PreSatori>
	);
}
