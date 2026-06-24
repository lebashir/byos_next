import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// WHOS-THAT-POKEMON-ALMANAC — the silhouette guessing game rendered as an
// antique almanac riddle / engraving: "A CURIOUS SPECIMEN".
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic, matching wg-almanac:
//   • double-rule page frame, centered masthead, ✦/✱ ornament dividers
//   • the silhouette framed as a specimen plate, geneva9 small-caps prompt
//   • the reveal printed as the answer line, geneva9 colophon footer
//
// The silhouette sprite is ALREADY a pure-black data URL (made server-side),
// so it is rendered as an <img> as-is — no CSS filter needed.
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 2px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface WtpAlmanacProps {
	name?: string;
	number?: string;
	spriteUrl?: string;
	reveal?: boolean;
	message?: string;
	width?: number;
	height?: number;
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

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

// A bold engraving question-mark seal, drawn outline-style for the unrevealed
// state. Sits centered beneath the plate.
function QuerySeal({ size }: { size: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="unknown"
		>
			<title>unknown specimen</title>
			<g>
				<circle
					cx={50}
					cy={50}
					r={46}
					fill="none"
					stroke="#000"
					strokeWidth={3}
				/>
				<circle
					cx={50}
					cy={50}
					r={40}
					fill="none"
					stroke="#000"
					strokeWidth={1.5}
				/>
				<path
					d="M36 38 a14 14 0 1 1 19 13 c-4 3 -5 6 -5 10"
					fill="none"
					stroke="#000"
					strokeWidth={5}
					strokeLinecap="round"
				/>
				<circle cx={50} cy={72} r={3.5} fill="#000" />
			</g>
		</svg>
	);
}

export default function WtpAlmanac({
	name = "",
	number = "",
	spriteUrl = "",
	reveal = true,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WtpAlmanacProps) {
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

	// Reveal text scales down so long names ("IT'S CRABOMINABLE!") stay on one
	// line in the wide blockKie display face.
	const answerText = reveal ? `It is ${name || "—"}` : "Name the specimen";
	const answerFontSize = Math.max(
		22,
		Math.min(42, (contentW - 40) / (answerText.length * 0.6)),
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
							THE ALMANAC OF ODDITIES
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: 40,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
							}}
						>
							A Curious Specimen
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
								<div style={{ display: "flex" }}>A RIDDLE FOR THE READER</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== PLATE + RIDDLE ===================== */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								flex: 1,
								alignItems: "stretch",
							}}
						>
							{/* --- LEFT: the silhouette specimen plate --- */}
							<div
								style={{
									display: "flex",
									width: "46%",
									border: "1.5px solid #000",
									boxSizing: "border-box",
									padding: 8,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{spriteUrl ? (
									<img
										src={spriteUrl}
										alt="A specimen in silhouette"
										width={230}
										height={230}
										style={{
											width: 230,
											height: 230,
											objectFit: "contain",
											imageRendering: "pixelated",
										}}
									/>
								) : null}
							</div>

							{/* --- RIGHT: the riddle prose + answer --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									paddingLeft: 18,
									justifyContent: "center",
								}}
							>
								<div
									className="font-geneva9"
									style={{ display: "flex", fontSize: 15, ...SCAPS }}
								>
									THE QUESTION
								</div>
								<div
									className="font-inter"
									style={{
										display: "flex",
										fontSize: 19,
										fontStyle: "italic",
										lineHeight: 1.3,
										marginTop: 4,
									}}
								>
									“Here, drawn in shadow, stands a creature of curious aspect.
									What manner of beast might it be?”
								</div>

								{/* the seal of mystery, or the answer figure */}
								{reveal ? (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											marginTop: 14,
										}}
									>
										<div
											style={{
												display: "flex",
												height: 1,
												backgroundColor: "#000",
												marginBottom: 8,
											}}
										/>
										<div
											className="font-geneva9"
											style={{ display: "flex", fontSize: 15, ...SCAPS }}
										>
											THE ANSWER
										</div>
										<div
											className="font-blockKie"
											style={{
												display: "flex",
												fontSize: answerFontSize,
												lineHeight: 1.05,
												marginTop: 2,
												whiteSpace: "nowrap",
											}}
										>
											{answerText}
										</div>
										<div
											className="font-inter"
											style={{
												display: "flex",
												fontSize: 16,
												marginTop: 2,
											}}
										>
											Catalogued {number || "—"}
										</div>
									</div>
								) : (
									<div
										style={{
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
											marginTop: 14,
										}}
									>
										<QuerySeal size={56} />
										<div
											className="font-blockKie"
											style={{
												display: "flex",
												fontSize: answerFontSize,
												lineHeight: 1.05,
												marginLeft: 12,
												whiteSpace: "nowrap",
											}}
										>
											{answerText}
										</div>
									</div>
								)}
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
							<div style={{ display: "flex" }}>ENGRAVED FROM THE SHADOW</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
