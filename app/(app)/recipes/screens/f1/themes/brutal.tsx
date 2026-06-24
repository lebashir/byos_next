import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster F1 race card (Müller-Brockmann in 1-bit). A bold race
// poster: an ENORMOUS auto-sized race name, the round / circuit / location set
// as tight labels, the date + a computed countdown stamped into one big solid
// black accent block, and a flat, chunky track motif rendered in inline SVG.
// The page stays PREDOMINANTLY WHITE — black is reserved for the thick rules,
// the single countdown block and the bold track stroke — so the e-ink panel
// stays balanced and ghost-free (≤30% ink).
// Pure #000 / #fff. Flexbox + inline SVG only — no grid, filter, gradient,
// shadow or opacity — so it survives the takumi/Satori renderer. SVG children
// are wrapped in <g>, never a React Fragment (takumi drops Fragment-wrapped SVG
// nodes).
// ---------------------------------------------------------------------------

interface F1BrutalProps {
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

const MONTHS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDate(dateISO: string): string {
	if (!dateISO) return "";
	const d = new Date(dateISO);
	if (Number.isNaN(d.getTime())) return "";
	const wd = WEEKDAYS[d.getDay()];
	const mo = MONTHS[d.getMonth()];
	return `${wd} ${mo} ${d.getDate()} ${d.getFullYear()}`;
}

// Whole-day delta off calendar midnight so TODAY / TOMORROW line up.
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
	if (days < 0) return "RACE WEEKEND";
	if (days === 0) return "TODAY";
	if (days === 1) return "IN 1 DAY";
	return `IN ${days} DAYS`;
}

// Size the ENORMOUS race name so the WHOLE thing fits — long names step the font
// down and wrap rather than getting sheared off. Never truncate.
function raceFontSize(s: string): number {
	const n = s.length;
	if (n <= 10) return 96;
	if (n <= 14) return 80;
	if (n <= 18) return 66;
	if (n <= 24) return 54;
	if (n <= 32) return 44;
	if (n <= 42) return 36;
	return 30;
}

// Hand-approximated circuit outlines (0..100 viewBox). Recognizable silhouette
// matters more than survey accuracy. A few flagship layouts; anything else falls
// back to a chunky generic loop.
const CIRCUIT_OUTLINES: Record<string, string> = {
	monaco:
		"M20 78 L18 50 Q18 38 30 36 L40 35 Q50 34 50 26 Q50 18 60 18 L72 18 Q82 18 82 28 L82 40 Q82 48 74 50 L60 52 Q52 54 56 62 L62 72 Q66 80 56 82 L34 84 Q22 86 20 78 Z",
	silverstone:
		"M16 60 L16 44 Q16 34 28 34 L44 34 Q52 34 56 28 L62 20 Q66 14 74 16 L84 18 Q92 20 90 30 L88 46 Q86 56 76 58 L66 60 Q58 62 60 70 L62 78 Q64 86 54 86 L28 86 Q16 86 16 76 Z",
	monza:
		"M20 84 L18 30 Q18 20 28 20 L40 20 Q48 20 48 30 L48 48 Q48 56 56 56 L78 56 Q88 56 88 66 L88 74 Q88 84 78 84 Z",
	spa: "M18 80 L16 56 Q16 46 26 44 L34 42 Q42 40 40 32 L38 24 Q36 16 46 16 L60 16 Q70 16 72 26 L76 44 Q78 54 70 58 L58 62 Q50 66 56 74 Q60 82 50 84 L30 86 Q18 88 18 80 Z",
	bahrain:
		"M20 78 L18 40 Q18 30 28 30 L46 30 Q54 30 54 22 L54 18 Q54 12 62 14 L80 18 Q90 20 88 30 L86 50 Q84 60 74 60 L60 60 Q52 60 56 68 L60 76 Q64 84 54 84 L30 86 Q20 86 20 78 Z",
	jeddah:
		"M16 82 L16 26 Q16 18 24 20 L34 24 Q42 28 44 22 Q46 14 54 18 L64 24 Q72 30 74 24 Q76 16 84 20 Q92 24 88 34 L84 80 Q82 86 74 84 L60 80 Q52 78 50 84 L24 86 Q16 88 16 82 Z",
	albert_park:
		"M22 74 L18 42 Q16 30 28 30 L46 28 Q56 28 58 20 Q60 12 70 16 L82 22 Q90 28 86 38 L80 62 Q76 72 66 72 L48 74 Q40 76 44 82 Q46 88 36 86 L28 84 Q22 82 22 74 Z",
	red_bull_ring:
		"M66 74 L40 80 L32 66 L18 41 L7 27 L3 21 L8 20 L20 20 L61 25 L63 28 L56 36 L50 37 L32 35 L29 41 L36 55 L43 56 L46 52 L53 48 L74 47 L93 48 L98 61 L96 64 L88 68 Z",
	hungaroring:
		"M29 74 L8 57 L17 55 L40 69 L44 65 L40 56 L52 29 L57 21 L53 6 L57 2 L65 5 L74 16 L73 19 L76 30 L84 34 L88 37 L86 48 L92 63 L72 88 L60 78 L55 78 L55 83 L65 92 L59 98 Z",
	zandvoort:
		"M14 47 L29 11 L35 11 L30 29 L27 41 L19 44 L23 50 L37 46 L56 48 L71 41 L92 42 L98 51 L90 67 L74 75 L66 67 L82 60 L83 52 L51 53 L31 61 L24 58 L27 87 L16 91 L6 87 L3 73 Z",
	catalunya:
		"M73 45 L42 93 L36 92 L24 97 L14 96 L11 90 L25 60 L32 62 L32 70 L23 85 L40 82 L49 68 L43 62 L37 46 L78 20 L74 15 L62 19 L57 18 L58 11 L72 2 L86 10 L89 17 Z",
	villeneuve:
		"M60 71 L63 87 L62 94 L65 96 L62 98 L50 89 L50 87 L42 78 L42 67 L38 66 L36 64 L35 51 L37 34 L40 32 L44 18 L43 3 L45 2 L46 10 L59 58 L58 61 Z",
	baku: "M90 33 L98 29 L94 20 L65 26 L58 40 L49 46 L45 51 L31 62 L27 54 L23 53 L22 50 L17 51 L5 58 L2 67 L3 79 L15 85 L21 79 L31 64 L47 52 L83 36 Z",
	marina_bay:
		"M96 43 L98 59 L86 65 L74 61 L64 58 L33 50 L25 54 L20 80 L16 81 L9 72 L8 67 L3 63 L8 50 L19 37 L26 44 L34 32 L56 44 L84 46 L86 40 L83 20 L87 20 L94 24 Z",
	americas:
		"M21 67 L36 77 L34 66 L45 56 L51 47 L57 41 L65 44 L72 39 L86 39 L98 24 L59 32 L37 35 L43 44 L37 45 L34 39 L36 50 L31 56 L23 55 L15 46 L2 51 Z",
	interlagos:
		"M26 71 L36 98 L52 97 L64 91 L80 31 L78 28 L63 27 L44 51 L33 57 L27 51 L25 38 L34 41 L38 35 L30 25 L31 17 L42 26 L52 23 L61 9 L48 2 L30 9 L23 29 L20 51 Z",
	rodriguez:
		"M20 17 L91 26 L96 28 L98 36 L95 45 L77 76 L80 79 L73 85 L74 63 L68 58 L66 53 L53 50 L51 45 L38 38 L15 35 L13 23 L11 24 L8 25 L3 24 L2 22 L7 16 Z",
	yas_marina:
		"M49 56 L64 53 L61 40 L53 36 L51 30 L52 10 L49 2 L39 30 L28 64 L33 70 L52 90 L71 98 L72 93 L57 88 L49 76 L55 75 L51 68 L40 70 L34 62 L34 58 Z",
	lusail:
		"M24 60 L10 35 L12 29 L29 36 L30 23 L48 2 L56 8 L46 22 L49 25 L66 18 L71 21 L64 33 L51 42 L49 47 L60 54 L84 54 L91 64 L82 76 L62 73 L50 96 L45 97 Z",
	vegas:
		"M74 87 L78 82 L74 80 L67 84 L62 80 L61 37 L75 36 L78 31 L77 27 L78 21 L61 19 L49 6 L37 2 L32 14 L23 33 L22 47 L21 89 L23 95 L36 98 L64 96 Z",
	imola:
		"M63 31 L47 28 L27 31 L21 37 L12 58 L12 63 L2 72 L4 75 L24 73 L34 74 L37 65 L35 54 L39 49 L42 50 L65 50 L75 48 L89 36 L98 31 L95 25 L78 31 Z",
};

// Chunky generic racetrack loop for circuits not in the lookup.
const GENERIC_OUTLINE =
	"M24 30 L60 30 Q72 30 72 22 Q72 16 80 18 Q88 20 86 30 L86 50 Q86 62 74 62 L60 62 Q50 62 52 70 Q54 78 44 78 L28 78 Q16 78 16 66 L16 42 Q16 30 24 30 Z";

function outlineFor(circuitId: string): string {
	return CIRCUIT_OUTLINES[circuitId] ?? GENERIC_OUTLINE;
}

// Big bold flat track motif — a thick black stroke with a solid start/finish
// block, drawn brutally heavy so it reads as a poster mark rather than a map.
function TrackMotif({ circuitId, size }: { circuitId: string; size: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="circuit"
		>
			<title>circuit</title>
			<g>
				<path
					d={outlineFor(circuitId)}
					fill="none"
					stroke="#000"
					strokeWidth={7}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				{/* solid start/finish block near the top-left of the loop */}
				<rect x="14" y="22" width="12" height="12" fill="#000" />
			</g>
		</svg>
	);
}

function F1Brutal({
	raceName = "",
	round = "",
	circuitName = "",
	circuitId = "",
	country = "",
	locality = "",
	dateISO = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: F1BrutalProps) {
	// --- Message state: render centred, nothing else. ---
	if (message) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black font-blockKie"
					style={{
						display: "flex",
						width,
						height,
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#fff",
						color: "#000",
						padding: 48,
						textAlign: "center",
						boxSizing: "border-box",
					}}
				>
					<div
						className="font-blockKie"
						style={{ display: "flex", fontSize: 36, lineHeight: 1.1 }}
					>
						{message}
					</div>
				</div>
			</PreSatori>
		);
	}

	const RULE = 7;
	const upperRace = (raceName || "GRAND PRIX").toUpperCase();
	const dateLabel = formatDate(dateISO);
	const countdown = countdownLabel(dateISO);
	const place = [locality, country].filter(Boolean).join(", ").toUpperCase();
	const PANEL = Math.round(width * 0.38); // right track-motif rail

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
				{/* ===================== EYEBROW ROW ===================== */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						paddingTop: 14,
						paddingLeft: 24,
						paddingRight: 24,
						boxSizing: "border-box",
						flexShrink: 0,
						overflow: "hidden",
					}}
				>
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							fontSize: 24,
							letterSpacing: 4,
							lineHeight: 1,
						}}
					>
						NEXT RACE
					</div>
					{round ? (
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: 24,
								letterSpacing: 2,
								lineHeight: 1,
								flexShrink: 0,
								marginLeft: 16,
							}}
						>
							ROUND {round}
						</div>
					) : null}
				</div>

				{/* thick rule under the eyebrow */}
				<div
					style={{
						height: RULE,
						backgroundColor: "#000",
						marginTop: 12,
						flexShrink: 0,
					}}
				/>

				{/* ===================== BODY: name + track rail ===================== */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						minHeight: 0,
						overflow: "hidden",
					}}
				>
					{/* LEFT: ENORMOUS race name + circuit + place */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							minWidth: 0,
							justifyContent: "center",
							paddingTop: 18,
							paddingBottom: 18,
							paddingLeft: 24,
							paddingRight: 20,
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: raceFontSize(upperRace),
								lineHeight: 0.98,
								letterSpacing: -1,
								overflow: "hidden",
							}}
						>
							{upperRace}
						</div>

						{circuitName ? (
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 26,
									lineHeight: 1.05,
									marginTop: 18,
									overflow: "hidden",
								}}
							>
								{circuitName.toUpperCase()}
							</div>
						) : null}

						{place ? (
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 20,
									lineHeight: 1.05,
									marginTop: 6,
									letterSpacing: 1,
									overflow: "hidden",
								}}
							>
								{place}
							</div>
						) : null}
					</div>

					{/* thick vertical rule between name + track */}
					<div
						style={{ width: RULE, backgroundColor: "#000", flexShrink: 0 }}
					/>

					{/* RIGHT: bold flat track motif on white */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: PANEL,
							flexShrink: 0,
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "#fff",
							padding: 22,
							boxSizing: "border-box",
							overflow: "hidden",
						}}
					>
						<TrackMotif circuitId={circuitId} size={PANEL - 70} />
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 16,
								marginTop: 14,
								letterSpacing: 2,
							}}
						>
							CIRCUIT
						</div>
					</div>
				</div>

				{/* thick rule above the date block */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ============ DATE + COUNTDOWN (one big black accent block) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						backgroundColor: "#000",
						paddingTop: 14,
						paddingBottom: 14,
						paddingLeft: 24,
						paddingRight: 24,
						boxSizing: "border-box",
						flexShrink: 0,
						overflow: "hidden",
					}}
				>
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: 30,
							lineHeight: 1,
							letterSpacing: 1,
							minWidth: 0,
							overflow: "hidden",
						}}
					>
						{dateLabel || "DATE TBC"}
					</div>
					{countdown ? (
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								color: "#fff",
								fontSize: 34,
								lineHeight: 1,
								letterSpacing: 1,
								marginLeft: 18,
								flexShrink: 0,
								overflow: "hidden",
							}}
						>
							{countdown}
						</div>
					) : null}
				</div>
			</div>
		</PreSatori>
	);
}

export default F1Brutal;
