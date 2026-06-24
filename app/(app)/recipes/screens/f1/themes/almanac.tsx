import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// F1-ALMANAC — the next Grand Prix rendered as a page from a vintage racing
// broadsheet: a "Grand Prix Gazette" masthead, a dateline with countdown, a
// ruled details table, and a decorative engraving-style track loop.
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic, matching wg-almanac:
//   • double-rule page frame, centered masthead, ✦/✱ ornament dividers
//   • ruled details table with geneva9 small-caps labels
//   • inline-SVG track engraving, geneva9 colophon footer
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface F1AlmanacProps {
	raceName?: string;
	round?: string;
	circuitName?: string;
	circuitId?: string;
	country?: string;
	locality?: string;
	dateISO?: string;
	message?: string;
	width?: number;
	height?: number;
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

const WEEKDAYS = [
	"SUNDAY",
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
];
const MONTHS = [
	"JANUARY",
	"FEBRUARY",
	"MARCH",
	"APRIL",
	"MAY",
	"JUNE",
	"JULY",
	"AUGUST",
	"SEPTEMBER",
	"OCTOBER",
	"NOVEMBER",
	"DECEMBER",
];

// Race date as a long almanac dateline, e.g. "SUNDAY, JUNE 29, 2026".
function formatRaceDate(dateISO: string): string {
	if (!dateISO) return "";
	const d = new Date(dateISO);
	if (Number.isNaN(d.getTime())) return "";
	return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Whole-day countdown computed from new Date(), measured at calendar midnight
// so "TODAY"/"IN N DAYS" line up regardless of the wall-clock time.
function countdownLabel(dateISO: string): string {
	if (!dateISO) return "";
	const d = new Date(dateISO);
	if (Number.isNaN(d.getTime())) return "";
	const now = new Date();
	const startOfDay = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const days = Math.round(
		(startOfDay(d) - startOfDay(now)) / (1000 * 60 * 60 * 24),
	);
	if (days < 0) return "RACE RUN";
	if (days === 0) return "TODAY";
	if (days === 1) return "IN 1 DAY";
	return `IN ${days} DAYS`;
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

// Decorative engraving-style racetrack loop. Not the real circuit — a stylised
// closed path with a couple of chicane kinks, drawn inside a 0..100 viewBox.
const TRACK_LOOP =
	"M26 30 L60 30 Q74 30 74 22 Q74 14 82 17 Q90 20 87 30 L87 52 Q87 64 74 64 L60 64 Q49 64 52 72 Q55 80 44 80 L28 80 Q14 80 14 66 L14 44 Q14 30 26 30 Z";
// Start/finish ticks straddling the top-left of the loop.
const TRACK_TICKS = "M23 25 L23 35 M28 25 L28 35";

function TrackEngraving({ size }: { size: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="racetrack"
		>
			<title>racetrack</title>
			<g fill="none" stroke="#000" strokeLinejoin="round" strokeLinecap="round">
				<path d={TRACK_LOOP} strokeWidth={3.5} />
				<path d={TRACK_TICKS} strokeWidth={3} />
			</g>
		</svg>
	);
}

export default function F1Almanac({
	raceName = "",
	round = "",
	circuitName = "",
	country = "",
	locality = "",
	dateISO = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: F1AlmanacProps) {
	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;

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

	const raceDate = formatRaceDate(dateISO);
	const countdown = countdownLabel(dateISO);
	const place = [locality, country].filter(Boolean).join(", ");

	// blockKie is a wide display face; scale the race name to fit one line.
	const nameText = raceName || "—";
	const nameFontSize = Math.max(
		22,
		Math.min(44, (contentW - 32) / (nameText.length * 0.62)),
	);

	const rows: [string, string][] = [
		["ROUND", round ? `NO. ${round}` : "—"],
		["CIRCUIT", circuitName || "—"],
		["LOCATION", place || "—"],
	];

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
							THE GRAND PRIX GAZETTE
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
								overflow: "hidden",
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
						{raceDate ? (
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
								<div style={{ display: "flex" }}>{raceDate}</div>
								<div style={{ display: "flex" }}>{countdown}</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== BODY ===================== */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								flex: 1,
								alignItems: "stretch",
							}}
						>
							{/* --- LEFT: ruled details table --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									paddingRight: 18,
									justifyContent: "center",
								}}
							>
								{rows.map(([label, value], i) => (
									<div
										key={label}
										style={{
											display: "flex",
											flexDirection: "column",
											paddingTop: i === 0 ? 0 : 8,
											paddingBottom: 8,
											borderBottom:
												i === rows.length - 1 ? "none" : "1px solid #000",
										}}
									>
										<div
											className="font-geneva9"
											style={{ display: "flex", fontSize: 15, ...SCAPS }}
										>
											{label}
										</div>
										<div
											className="font-inter"
											style={{
												display: "flex",
												fontSize: 22,
												lineHeight: 1.15,
												marginTop: 2,
											}}
										>
											{value}
										</div>
									</div>
								))}
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

							{/* --- RIGHT: track engraving plate --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									width: "40%",
									paddingLeft: 18,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<div
									style={{
										display: "flex",
										border: "1.5px solid #000",
										boxSizing: "border-box",
										padding: 10,
									}}
								>
									<TrackEngraving size={Math.min(190, contentW * 0.32)} />
								</div>
								<div
									className="font-geneva9"
									style={{
										display: "flex",
										fontSize: 15,
										paddingTop: 6,
										...SCAPS,
									}}
								>
									THE CIRCUIT
								</div>
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
							<div style={{ display: "flex" }}>THE MOTOR RACING CALENDAR</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
