import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// Pokédex (Mac) — a Pokédex entry restyled as a 1984 Macintosh "Get Info"
// window: a chrome window on the dithered desktop, the sprite framed in an
// inset "well", stats drawn as Mac progress-bar rows, types as little
// framed badges, flavor text in a boxed note. Pure #000 / #fff. Flexbox +
// inline SVG only (Takumi-safe). SVG children use <g>, never <>.
// ===========================================================================

// Round to at most one decimal, dropping a trailing ".0".
const fmt = (n: number) => {
	const r = Math.round(n * 10) / 10;
	return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

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

interface PokedexMacProps {
	id?: number;
	name?: string;
	number?: string;
	genus?: string;
	types?: string[];
	heightM?: number;
	weightKg?: number;
	stats?: { label: string; value: number }[];
	spriteUrl?: string;
	flavor?: string;
	message?: string;
	width?: number;
	height?: number;
}

function PokedexMac({
	name = "",
	number = "",
	genus = "",
	types = [],
	heightM = 0,
	weightKg = 0,
	stats = [],
	spriteUrl = "",
	flavor = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: PokedexMacProps) {
	// --- Desktop geometry: window floats on the dithered desktop with a hard
	// 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;

	const STAT_MAX = 255;
	const TRACK_W = 188;
	const TRACK_H = 14;

	// Shared desktop shell (checkerboard + drop-shadowed window) with a
	// titled title bar. Children render inside the window content area.
	const titleText = name ? `Get Info — ${name}` : "Get Info";

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
						id="pdDeskDither"
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
					fill="url(#pdDeskDither)"
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
				{/* Title bar. */}
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
							width={Math.max(10, Math.floor(winW * 0.26))}
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
						{titleText}
					</div>
					<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
						<DragStripes
							width={Math.max(10, Math.floor(winW * 0.26))}
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
							fontSize: 20,
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
				{/* Window content. */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						padding: "10px 12px 10px",
						boxSizing: "border-box",
						backgroundColor: "#fff",
					}}
				>
					{/* Header line — number + NAME, like a document heading. */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "baseline",
							borderBottom: "2px solid #000",
							paddingBottom: 5,
							marginBottom: 8,
						}}
					>
						<div
							className="font-blockKie"
							style={{ display: "flex", fontSize: 24 }}
						>
							{name.toUpperCase() || "—"}
						</div>
						<div
							className="font-geneva9"
							style={{ display: "flex", fontSize: 16, marginLeft: 10 }}
						>
							{number}
						</div>
					</div>

					{/* Main row: sprite well (left) + info panel (right). */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							flex: 1,
							alignItems: "stretch",
						}}
					>
						{/* Sprite well — an inset framed icon box. */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								width: 196,
								flexShrink: 0,
							}}
						>
							<div
								style={{
									display: "flex",
									flex: 1,
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
										alt={name}
										width={180}
										height={180}
										style={{
											width: 180,
											height: 180,
											imageRendering: "pixelated",
											objectFit: "contain",
										}}
									/>
								) : null}
							</div>
							{/* Genus caption under the well. */}
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "center",
									fontSize: 15,
									marginTop: 6,
									textAlign: "center",
									whiteSpace: "nowrap",
									overflow: "hidden",
								}}
							>
								{genus}
							</div>
						</div>

						{/* Info panel on the right. */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								marginLeft: 12,
								overflow: "hidden",
							}}
						>
							{/* Type "buttons" — framed Mac badges. */}
							<div
								style={{
									display: "flex",
									flexDirection: "row",
									flexWrap: "wrap",
								}}
							>
								{types.map((t) => (
									<div
										key={t}
										className="font-geneva9"
										style={{
											display: "flex",
											border: "2px solid #000",
											padding: "2px 10px",
											fontSize: 15,
											marginRight: 6,
											marginBottom: 4,
											lineHeight: 1.2,
											backgroundColor: "#fff",
										}}
									>
										{t.toUpperCase()}
									</div>
								))}
							</div>

							{/* Height / Weight row. */}
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									flexDirection: "row",
									fontSize: 16,
									marginTop: 4,
									marginBottom: 6,
								}}
							>
								<div style={{ display: "flex", marginRight: 20 }}>
									HT {fmt(heightM)} m
								</div>
								<div style={{ display: "flex" }}>WT {fmt(weightKg)} kg</div>
							</div>

							{/* Stat rows — Mac progress-bar style (framed track, solid
							    fill, ticks for the segmented look). */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									justifyContent: "center",
								}}
							>
								{stats.map((s) => {
									const ratio = Math.max(0, Math.min(1, s.value / STAT_MAX));
									const fillW = Math.round(ratio * (TRACK_W - 4));
									return (
										<div
											key={s.label}
											style={{
												display: "flex",
												flexDirection: "row",
												alignItems: "center",
												marginBottom: 5,
											}}
										>
											<div
												className="font-geneva9"
												style={{ display: "flex", width: 58, fontSize: 15 }}
											>
												{s.label}
											</div>
											{/* The framed progress track. */}
											<div
												style={{
													display: "flex",
													width: TRACK_W,
													height: TRACK_H,
													border: "2px solid #000",
													backgroundColor: "#fff",
													alignItems: "stretch",
													overflow: "hidden",
													boxSizing: "border-box",
													position: "relative",
												}}
											>
												{/* Solid fill. */}
												<div
													style={{
														display: "flex",
														width: fillW,
														height: "100%",
														backgroundColor: "#000",
													}}
												/>
											</div>
											<div
												className="font-geneva9"
												style={{
													display: "flex",
													justifyContent: "flex-end",
													width: 34,
													fontSize: 15,
													marginLeft: 8,
												}}
											>
												{s.value}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Flavor note — a boxed Mac "comments" well. */}
					<div
						style={{
							display: "flex",
							border: "2px solid #000",
							backgroundColor: "#fff",
							padding: "6px 10px",
							marginTop: 8,
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 16,
								lineHeight: 1.25,
								overflow: "hidden",
								maxHeight: 44,
							}}
						>
							{flavor}
						</div>
					</div>
				</div>
			</Shell>
		</PreSatori>
	);
}

export default PokedexMac;
