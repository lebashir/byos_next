import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// POKEDEX-ALMANAC — a Pokédex entry rendered as a page from an antique
// illustrated "field guide of curious species".
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic, matching wg-almanac:
//   • double-rule page frame, centered masthead, ✦/✱ ornament dividers
//   • framed specimen plate, ruled stat table with geneva9 small-caps labels
//   • italic flavor as the naturalist's note, geneva9 colophon footer
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 2px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface PokedexAlmanacProps {
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

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// Round to at most one decimal, dropping a trailing ".0".
const fmt = (n: number) => {
	const r = Math.round(n * 10) / 10;
	return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// Today's dateline, e.g. "WEDNESDAY, JUNE 24, 2026".
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
// Centered decorative divider, mirroring wg-almanac's OrnDivider.
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

export default function PokedexAlmanac({
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
}: PokedexAlmanacProps) {
	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;
	const dateline = todayLabel();

	// ----- empty / error state — render the message centered, still framed. ---
	if (message) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black"
					style={{
						display: "flex",
						width,
						height,
						boxSizing: "border-box",
						padding: FRAME,
					}}
				>
					<div
						style={{
							display: "flex",
							flex: 1,
							border: "2px solid #000",
							boxSizing: "border-box",
							padding: RULE_GAP,
						}}
					>
						<div
							style={{
								display: "flex",
								flex: 1,
								border: "1px solid #000",
								boxSizing: "border-box",
								alignItems: "center",
								justifyContent: "center",
								padding: 30,
							}}
						>
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 30,
									textAlign: "center",
									lineHeight: 1.3,
								}}
							>
								{message}
							</div>
						</div>
					</div>
				</div>
			</PreSatori>
		);
	}

	const STAT_MAX = 255;
	// blockKie is a wide display face; scale the species name to fit one line.
	const nameText = name || "—";
	const nameFontSize = Math.max(
		22,
		Math.min(44, (contentW - 32) / (nameText.length * 0.62)),
	);

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
							padding: "10px 16px 12px",
						}}
					>
						{/* ================= MASTHEAD ================= */}
						<div
							style={{
								display: "flex",
								height: 5,
								backgroundColor: "#000",
								marginBottom: 6,
							}}
						/>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: 15,
								marginBottom: 6,
								...SCAPS,
							}}
						>
							THE NATURALIST'S FIELD GUIDE
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: nameFontSize,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
							}}
						>
							{nameText}
						</div>
						<div
							style={{
								display: "flex",
								height: 1.5,
								backgroundColor: "#000",
								marginTop: 6,
							}}
						/>
						{dateline ? (
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 15,
									paddingTop: 4,
									...SCAPS,
								}}
							>
								<div style={{ display: "flex" }}>{dateline}</div>
								<div style={{ display: "flex" }}>SPECIMEN {number || "—"}</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== ENTRY BODY ===================== */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								flex: 1,
								alignItems: "stretch",
							}}
						>
							{/* --- LEFT: framed specimen plate --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									width: "44%",
									paddingRight: 16,
								}}
							>
								<div
									style={{
										display: "flex",
										flex: 1,
										border: "1.5px solid #000",
										boxSizing: "border-box",
										padding: 8,
										alignItems: "center",
										justifyContent: "center",
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
									{spriteUrl ? (
										<img
											src={spriteUrl}
											alt={name}
											width={210}
											height={210}
											style={{
												width: 210,
												height: 210,
												imageRendering: "pixelated",
												objectFit: "contain",
											}}
										/>
									) : null}
								</div>
								{/* genus plate caption */}
								<div
									className="font-geneva9"
									style={{
										display: "flex",
										justifyContent: "center",
										fontSize: 15,
										paddingTop: 6,
										...SCAPS,
									}}
								>
									{(genus || "UNKNOWN SPECIES").toUpperCase()}
								</div>
							</div>

							{/* --- vertical rule --- */}
							<div
								style={{
									display: "flex",
									width: 1.5,
									alignSelf: "stretch",
									backgroundColor: "#000",
								}}
							/>

							{/* --- RIGHT: characters & stat table --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									paddingLeft: 16,
								}}
							>
								{/* ORDER (types) + measurements row */}
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "flex-start",
										justifyContent: "space-between",
										paddingBottom: 6,
										borderBottom: "1px solid #000",
									}}
								>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										<div
											className="font-geneva9"
											style={{ display: "flex", fontSize: 15, ...SCAPS }}
										>
											ORDER
										</div>
										<div
											style={{
												display: "flex",
												flexDirection: "row",
												flexWrap: "wrap",
												marginTop: 3,
											}}
										>
											{types.length > 0 ? (
												types.map((t) => (
													<div
														key={t}
														className="font-inter"
														style={{
															display: "flex",
															border: "1.5px solid #000",
															padding: "1px 10px",
															fontSize: 16,
															marginRight: 6,
															marginBottom: 2,
														}}
													>
														{t.toUpperCase()}
													</div>
												))
											) : (
												<div
													className="font-inter"
													style={{ display: "flex", fontSize: 16 }}
												>
													—
												</div>
											)}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "flex-end",
										}}
									>
										<div
											className="font-geneva9"
											style={{ display: "flex", fontSize: 15, ...SCAPS }}
										>
											STATURE
										</div>
										<div
											className="font-inter"
											style={{
												display: "flex",
												fontSize: 18,
												marginTop: 3,
											}}
										>
											{fmt(heightM)} m · {fmt(weightKg)} kg
										</div>
									</div>
								</div>

								{/* CONSTITUTION heading */}
								<div
									className="font-geneva9"
									style={{
										display: "flex",
										fontSize: 15,
										paddingTop: 6,
										paddingBottom: 2,
										...SCAPS,
									}}
								>
									CONSTITUTION
								</div>

								{/* ruled stat table */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										flex: 1,
									}}
								>
									{stats.map((s, i) => {
										const ratio = Math.max(0, Math.min(1, s.value / STAT_MAX));
										return (
											<div
												key={s.label}
												style={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center",
													flex: 1,
													borderTop: i === 0 ? "none" : "1px solid #000",
												}}
											>
												<div
													className="font-geneva9"
													style={{
														display: "flex",
														width: 64,
														fontSize: 15,
														letterSpacing: 1,
													}}
												>
													{s.label}
												</div>
												{/* engraving track */}
												<div
													style={{
														display: "flex",
														flex: 1,
														height: 12,
														border: "1.5px solid #000",
														boxSizing: "border-box",
														alignItems: "stretch",
														overflow: "hidden",
													}}
												>
													<div
														style={{
															display: "flex",
															width: `${Math.round(ratio * 100)}%`,
															height: "100%",
															backgroundColor: "#000",
														}}
													/>
												</div>
												<div
													className="font-inter"
													style={{
														display: "flex",
														width: 36,
														justifyContent: "flex-end",
														fontSize: 17,
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

						{/* ============ ornament before naturalist's note ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ================= NATURALIST'S NOTE (flavor) ================= */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "baseline",
							}}
						>
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									fontSize: 15,
									marginRight: 8,
									...SCAPS,
								}}
							>
								NOTE
							</div>
							<div
								className="font-inter"
								style={{
									display: "flex",
									flex: 1,
									fontSize: 16,
									fontStyle: "italic",
									lineHeight: 1.25,
									overflow: "hidden",
									maxHeight: 42,
								}}
							>
								{flavor ? `“${flavor}”` : "No field observations recorded."}
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
							<div style={{ display: "flex" }}>FROM LIFE</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
