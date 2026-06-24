import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface F1Props {
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

// Hand-approximated circuit outlines. Each is drawn inside a 0..100 x 0..100
// viewBox so it can be scaled into any panel. Recognizable silhouette matters
// more than survey accuracy. Closed-ish single strokes, no fill.
const CIRCUIT_OUTLINES: Record<string, string> = {
	// Monaco — tight street circuit: hairpin + harbour chicane.
	monaco:
		"M20 78 L18 50 Q18 38 30 36 L40 35 Q50 34 50 26 Q50 18 60 18 L72 18 Q82 18 82 28 L82 40 Q82 48 74 50 L60 52 Q52 54 56 62 L62 72 Q66 80 56 82 L34 84 Q22 86 20 78 Z",
	// Silverstone — fast flowing arena, Maggotts/Becketts complex on one side.
	silverstone:
		"M16 60 L16 44 Q16 34 28 34 L44 34 Q52 34 56 28 L62 20 Q66 14 74 16 L84 18 Q92 20 90 30 L88 46 Q86 56 76 58 L66 60 Q58 62 60 70 L62 78 Q64 86 54 86 L28 86 Q16 86 16 76 Z",
	// Monza — the long straights + Curva Grande + Parabolica.
	monza:
		"M20 84 L18 30 Q18 20 28 20 L40 20 Q48 20 48 30 L48 48 Q48 56 56 56 L78 56 Q88 56 88 66 L88 74 Q88 84 78 84 Z",
	// Spa — sweeping forest layout with Eau Rouge kink up the hill.
	spa: "M18 80 L16 56 Q16 46 26 44 L34 42 Q42 40 40 32 L38 24 Q36 16 46 16 L60 16 Q70 16 72 26 L76 44 Q78 54 70 58 L58 62 Q50 66 56 74 Q60 82 50 84 L30 86 Q18 88 18 80 Z",
	// Suzuka — figure-eight crossover.
	suzuka:
		"M18 30 Q18 20 30 22 L52 26 Q60 28 60 36 Q60 44 52 46 L36 50 Q28 52 36 58 L58 70 Q68 76 80 74 Q90 72 88 62 Q86 50 76 50 L62 50 M18 30 Q16 42 28 44 L44 46",
	// Bahrain — stop/start layout with a long back straight.
	bahrain:
		"M20 78 L18 40 Q18 30 28 30 L46 30 Q54 30 54 22 L54 18 Q54 12 62 14 L80 18 Q90 20 88 30 L86 50 Q84 60 74 60 L60 60 Q52 60 56 68 L60 76 Q64 84 54 84 L30 86 Q20 86 20 78 Z",
	// Jeddah — ultra-fast street circuit, many flowing kinks.
	jeddah:
		"M16 82 L16 26 Q16 18 24 20 L34 24 Q42 28 44 22 Q46 14 54 18 L64 24 Q72 30 74 24 Q76 16 84 20 Q92 24 88 34 L84 80 Q82 86 74 84 L60 80 Q52 78 50 84 L24 86 Q16 88 16 82 Z",
	// Albert Park (Melbourne) — parkland lake circuit.
	albert_park:
		"M22 74 L18 42 Q16 30 28 30 L46 28 Q56 28 58 20 Q60 12 70 16 L82 22 Q90 28 86 38 L80 62 Q76 72 66 72 L48 74 Q40 76 44 82 Q46 88 36 86 L28 84 Q22 82 22 74 Z",
	// Red Bull Ring (Spielberg) — compact, angular sail shape: short pit straight, long uphill runs, descending right-handers.
	red_bull_ring:
		"M66 74 L59.4 75.7 L41.9 80.3 L39.8 77.1 L31.5 65.5 L24.9 54.7 L18.4 40.6 L16.3 37.1 L7.4 27.5 L2 21.7 L2.6 20.6 L8.1 19.9 L16.6 19.8 L20.7 20.2 L40.1 23.7 L61.1 25.2 L63 26.4 L63.2 28.2 L61.4 31.2 L60.2 32.5 L55.8 35.6 L50 37 L34.7 34.9 L31.7 35.5 L29.5 37.4 L28.5 40.1 L28.4 41.4 L29 43.9 L35.9 55.3 L39.3 56.7 L42.9 55.8 L45.2 53.4 L46.3 52 L48.9 49.9 L52.8 48 L74.2 47.1 L90.4 46.8 L93.1 48.3 L94.1 49.5 L97.8 61.2 L97.8 62.8 L96.3 64.2 L92.8 66.2 L87.9 68 Z",
	// Hungaroring — tight, twisty, stadium-like with a go-kart feel.
	hungaroring:
		"M28.7 74.3 L7.8 57.3 L8 55.2 L9.9 54.4 L17.3 54.9 L24.9 58.4 L39.6 69.3 L42.1 68.7 L43.6 67.1 L44 64.8 L39.4 55.7 L39.8 53.1 L51.5 29.3 L56.2 22.8 L56.9 20.8 L53.5 5.7 L54.8 3.2 L57.4 2 L60.8 2.8 L64.5 5.3 L74.4 16 L74.1 17.6 L72.9 19 L75.6 29.8 L76.9 32 L84.3 33.7 L86.6 35 L87.5 37.3 L86 48.1 L86.4 51.8 L92.4 62.8 L92.1 65.2 L82.6 76.3 L71.8 88.4 L70.1 88.2 L59.6 77.7 L57.4 77 L55 78.2 L54.3 80.3 L55.2 82.6 L65.2 91.9 L64.9 95.1 L62.7 97.4 L59.1 97.8 Z",
	// Zandvoort — flowing dunes with banked Turn 3 and a banked final corner.
	zandvoort:
		"M13.7 46.5 L28.6 10.9 L32.1 9.1 L35.4 11.2 L35.9 13.9 L30.2 28.8 L29.6 38.2 L27.1 40.6 L19 44.2 L19.2 48.2 L23.2 49.6 L36.6 45.9 L46.5 46.5 L55.5 48.2 L60.7 47 L70.7 41.4 L78.8 40.5 L91.5 41.6 L96.3 45.5 L98 51.1 L96 57.2 L89.5 66.6 L81.2 76.2 L73.5 74.7 L67.6 71.2 L65.8 66.6 L70.9 63.1 L82.4 60.1 L85.1 57.1 L82.9 51.8 L66.1 50.4 L50.9 53.1 L37.4 58.2 L31.4 60.8 L29.5 57.7 L24.8 57.6 L23.9 62.7 L27.3 87.3 L26 89.3 L15.6 90.9 L9.9 89.8 L5.7 87.1 L2.2 80.8 L2.9 72.7 Z",
	// Catalunya (Barcelona) — long front straight, fast Turn 3, tight final sector.
	catalunya:
		"M72.6 44.9 L51 79.3 L42.1 93.1 L39.2 94 L35.9 92.1 L31.7 91.9 L24.2 97.1 L21.2 98 L17 97.4 L14.4 95.7 L11.1 90.1 L10.8 86 L12.4 79.8 L24.7 60.2 L28.1 59.4 L31.6 61.8 L32.8 66.6 L31.9 70.3 L23.3 85.3 L24.2 87.1 L27 87.7 L40.1 81.6 L48.6 70.7 L49.1 67.8 L45.7 64.8 L43 61.8 L36.9 46.4 L37.8 42 L40.3 39.3 L77.5 19.8 L77.2 16.8 L74.4 14.9 L70.2 14.6 L66.4 16.2 L62.4 19.1 L57.8 17.7 L56.6 14.7 L58.3 10.8 L68.6 2.6 L72.2 2 L78.6 5.4 L85.9 10.1 L88.6 13.1 L89.2 17 Z",
	// Villeneuve (Montreal) — narrow elongated semi-permanent: long straights, hairpin, Wall of Champions chicane.
	villeneuve:
		"M60.5 71.5 L62.6 81 L63.1 86.5 L62.5 93.9 L65.4 95.6 L65.5 96.7 L64.7 97.7 L62.2 97.8 L58.3 96.6 L55.4 94.8 L49.7 89.6 L49.7 88.7 L50.1 87 L46.1 81.4 L44.1 79.9 L42.5 78.2 L41.6 74.8 L41.7 67.1 L40.9 66.2 L38.4 66.4 L37 65.7 L36.1 64.7 L35.2 62 L34.8 59.2 L34.5 50.7 L34.7 45.7 L37.2 34.2 L38 33.2 L39.2 33.1 L40.9 32 L41.7 30.3 L44.4 18.3 L44.7 11.2 L43.2 3.3 L43.2 2.5 L44.5 2.1 L44.9 2.7 L45.3 6.6 L46.7 10.3 L52.2 23.9 L59.4 57.8 L59.4 59.9 L58.5 60.4 L58.4 61.3 Z",
	// Baku — street circuit: very long straight + a tight castle section, long and thin.
	baku: "M90.3 32.9 L97.3 29.9 L98 29.1 L97.9 28.1 L94 19.7 L91.7 15 L84.6 17.6 L65.1 25.8 L54.8 30.9 L58 40 L57.5 41.2 L48.9 45.5 L44.5 48.6 L45.3 50.6 L44.9 51.4 L33.7 60.2 L31.4 62.1 L30.2 61.5 L27.4 53.7 L26.3 53.6 L24.8 52.9 L23.7 53 L22.7 52.3 L22.2 50.5 L21.6 50 L17 51.3 L6.3 57 L4.8 58.6 L2.1 66.9 L2.7 77.6 L3.4 78.8 L14.5 84.5 L16.6 85.1 L18.1 84.5 L21.1 79.2 L22.4 77.2 L30.5 69.5 L31.5 64.2 L32.3 62.5 L43.7 53.6 L46.8 51.7 L53.2 49 L68 42.5 L83.2 35.9 Z",
	// Marina Bay (Singapore) — tight twisty street circuit, many 90-degree corners.
	marina_bay:
		"M95.9 42.6 L98 59.1 L94.9 64.4 L94.1 65.2 L86.2 64.9 L75 63.2 L74 61.2 L73.7 58.9 L64.3 58.4 L42.8 57.1 L32.7 49.8 L28.6 46.8 L27 47.4 L24.7 54.4 L19.8 80 L18.9 81 L17.3 81 L15.8 78.9 L11.6 74.6 L8.6 71.6 L8.1 68.7 L8.5 66.7 L5.2 65.2 L2.6 63.2 L2 60.2 L7.7 50.1 L15.6 36.7 L18.6 36.8 L26.2 44.3 L27.7 43.7 L33.9 32.5 L35.6 32.8 L56.3 44.2 L83.6 45.9 L85.9 44.6 L86.5 39.6 L83.7 30.1 L82.5 26.5 L83.5 19.8 L85.1 18.9 L86.8 20.4 L89.4 22.2 L92.3 22.4 L93.8 24.3 Z",
	// Americas (COTA) — steep Turn 1, fast esses, long back straight + hairpin.
	americas:
		"M21.3 67.4 L34.2 77.1 L35.7 77.3 L34.1 71 L33.1 66.3 L34.3 63.3 L41.6 58.3 L44.9 55.6 L46.2 52.5 L47.8 51.3 L50.8 49.5 L51.5 46.5 L52.6 44 L55.1 42 L57.7 41.4 L64.5 44.1 L67.8 41.6 L70.5 39 L72.4 39.1 L74.1 40.7 L75.5 41.7 L85.6 39.1 L97.9 23.6 L97.4 22.6 L86.8 25.7 L58.5 32 L36.5 34.8 L36.7 35.6 L42.7 44.2 L41.6 45.4 L37.7 44.9 L36.5 42.1 L33.7 39.4 L31 39.3 L34.3 46.2 L35.6 50.9 L34.6 53.7 L30.1 56.3 L26.9 56.2 L23.3 54.5 L16.8 45.7 L14.8 45.6 L2.4 51.1 L2.4 52.5 Z",
	// Interlagos — compact anticlockwise, the Senna S, short layout.
	interlagos:
		"M25.6 70.9 L32.1 95.1 L35.9 98 L40.8 94.1 L44.4 93.7 L52 96.7 L58.4 95.6 L64.1 90.5 L69.2 74.8 L77.2 43.4 L80.3 31.3 L78.4 27.9 L68.3 25.8 L62.8 27.3 L57.6 32.4 L43.8 51.3 L39.4 56.4 L33.1 56.8 L29.3 55 L26.9 50.9 L25.2 41.6 L26.6 38.1 L29.3 38.3 L33.6 40.8 L37.1 39.5 L38 35.5 L33 29.8 L29.8 24.6 L28.9 18.1 L30.8 16.5 L38.7 24.2 L42.2 26.2 L47.2 26.2 L52.2 22.7 L60.9 8.8 L60.6 6.3 L56.2 4.1 L47.5 2.2 L36.9 5.2 L29.6 9.5 L25.9 14.7 L22.6 28.9 L19.7 41 L20.6 50.7 Z",
	// Rodriguez (Mexico City) — long main straight + stadium section through the old arena.
	rodriguez:
		"M19.5 16.7 L51.1 21 L63.1 22.3 L90.9 26.3 L95.5 27.6 L95.7 28.4 L95.1 33.2 L97.7 34.8 L98 35.7 L97.1 40.8 L95.1 45.3 L76.7 75.4 L76.7 76.5 L79.9 78.7 L80 79.8 L74.1 84.3 L73.1 84.7 L71.6 83.5 L74 63.3 L73.8 62.2 L72.8 61.3 L68.3 57.9 L67 55 L65.6 53.2 L54.7 50.9 L53.1 50 L52.6 49.2 L51 44.9 L42.4 39.8 L37.7 38.3 L15.1 34.9 L14.6 33.6 L13.8 24 L13.3 23.2 L11.7 23.7 L10.4 25.2 L9.3 25.4 L7.7 24.7 L2.6 23.8 L2 23.1 L2.2 21.6 L4.5 17.5 L7.2 15.8 L10 15.3 Z",
	// Yas Marina (Abu Dhabi) — long straights, hairpin, narrow marina section.
	yas_marina:
		"M49.4 55.8 L64 53.2 L64.3 50.9 L61.3 40.1 L55.9 37.8 L52.9 35.8 L51.2 33 L51.2 29.5 L52.9 21.8 L51.7 9.7 L50.8 3.3 L49.3 2 L47.9 2.3 L47 3.5 L38.7 29.5 L33.6 44.8 L27.8 63.5 L27.5 64.9 L30.5 65 L32.5 70 L34.3 74.2 L39.6 80.2 L52.4 90.2 L59.4 94.1 L68.1 98 L71 97.2 L72.2 95.6 L72.4 93.1 L71.5 91 L69.2 89.5 L57.3 88.4 L51.1 84.8 L49.9 83.1 L49 76.7 L54.2 75.8 L55.2 74.6 L55 69.3 L53.2 68.5 L50.7 68.4 L40 69.8 L38 69 L33.8 62.1 L33.3 60 L33.8 58.2 Z",
	// Lusail (Qatar) — fast flowing oval-ish with many medium-speed corners.
	lusail:
		"M23.6 60.1 L9.6 34.5 L9.5 31.8 L12 29.2 L14.7 29.3 L27 35.7 L29.6 34.1 L30.2 23 L30.7 20.7 L31.9 19 L48.2 2.1 L50.6 2.3 L56.3 7.8 L56.4 10 L46.2 22.1 L45.8 23.7 L46.5 24.9 L48.7 25.3 L65.8 18.4 L69.3 19 L70.7 20.9 L70.5 23.9 L69.3 25.5 L66.7 28.1 L63.7 33.5 L62.8 37.3 L60.9 39.8 L50.7 42.5 L48.9 44.4 L48.9 46.6 L51.7 49.7 L59.9 54.3 L65.5 55.1 L83.6 53.6 L86.1 55.1 L90.7 63.6 L90.5 65.5 L84.9 74.7 L82.4 76.1 L65.2 72.8 L62 73.8 L50.3 96.1 L46.9 98 L44.7 97.4 Z",
	// Vegas (Las Vegas Strip) — very long straights, mostly 90-degree corners, long and thin.
	vegas:
		"M74 87.2 L77.2 83.6 L77.8 82 L76.9 80.8 L73.9 80.3 L71.1 81.8 L68.7 84 L66.4 84.3 L63.4 82.7 L61.6 79.6 L61.5 36.8 L73.3 36.6 L75.3 35.9 L77.5 33.4 L78.4 31.4 L78.7 27.9 L77 27.5 L76.2 26.6 L76.1 25.1 L78 21.4 L76.9 19.7 L61.3 19.2 L52.6 15.7 L48.6 6.8 L45.4 4 L41.2 2.6 L37.4 2.4 L36.8 4.1 L31.9 13.6 L29.9 17.1 L25.4 27.3 L23.7 33.4 L22.7 38.5 L22.1 47 L22.1 58.1 L21.6 77.2 L21.4 89.5 L21.9 95 L23.4 95.2 L26.3 97.5 L35.7 98 L57.9 97.9 L64.6 96.8 L66.2 95.9 Z",
	// Imola — old-school anticlockwise, fast chicanes Tamburello/Variante.
	imola:
		"M62.9 31 L61.2 31 L46.8 28.3 L33.5 29.3 L27.4 31 L27 31.8 L26.3 34 L20.6 37.1 L11.8 57.9 L11.7 59.1 L12.5 62.7 L11.9 63.7 L2.4 71.9 L2 72.9 L2.5 74.3 L3.4 74.8 L19.7 72.8 L24 72.8 L28.5 73.6 L32.5 74.3 L34 73.8 L35.7 71.5 L37.3 66.8 L37.4 65.2 L35.2 54.6 L35.5 53.4 L38 49.5 L39 49.2 L41.5 50.2 L64.4 50.2 L65 51 L65.4 51.7 L74.8 48 L79.6 44.9 L81.7 42.9 L88.8 36 L90.9 34.7 L97.9 31.3 L97.9 30 L95.4 25.4 L94.2 25.2 L84.8 28.7 L80 30.5 L77.5 31 Z",
};

// A generic stylized racetrack loop (rounded-rect oval with a couple of
// chicane kinks) for circuits not in the lookup.
const GENERIC_OUTLINE =
	"M24 30 L60 30 Q72 30 72 22 Q72 16 80 18 Q88 20 86 30 L86 50 Q86 62 74 62 L60 62 Q50 62 52 70 Q54 78 44 78 L28 78 Q16 78 16 66 L16 42 Q16 30 24 30 Z";

// Start/finish tick anchored near the top-left of each outline path.
const START_TICK = "M22 26 L22 36";

function outlineFor(circuitId: string): string {
	return CIRCUIT_OUTLINES[circuitId] ?? GENERIC_OUTLINE;
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
	return `${wd} ${mo} ${d.getDate()}, ${d.getFullYear()}`;
}

function countdownLabel(dateISO: string): string {
	if (!dateISO) return "";
	const d = new Date(dateISO);
	if (Number.isNaN(d.getTime())) return "";
	const now = new Date();
	// Whole-day delta based on calendar midnight, so "TODAY"/"TOMORROW" line up.
	const startOfDay = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const days = Math.round(
		(startOfDay(d) - startOfDay(now)) / (1000 * 60 * 60 * 24),
	);
	if (days < 0) return "RACE WEEKEND";
	if (days === 0) return "TODAY";
	if (days === 1) return "TOMORROW";
	return `IN ${days} DAYS`;
}

export default function F1({
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
}: F1Props) {
	// Message state — render centered, nothing else.
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
						padding: 40,
					}}
				>
					<div
						className="font-blockKie"
						style={{ fontSize: 28, textAlign: "center" }}
					>
						{message}
					</div>
				</div>
			</PreSatori>
		);
	}

	const dateLabel = formatDate(dateISO);
	const countdown = countdownLabel(dateISO);
	const place = [locality, country].filter(Boolean).join(", ");

	// Left content column ~60%, circuit outline panel ~40%.
	const PANEL = Math.round(width * 0.4);
	const PAD = 28;

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-blockKie"
				style={{ display: "flex", width, height }}
			>
				{/* LEFT: text block */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: width - PANEL,
						height,
						padding: `${PAD}px ${PAD}px ${PAD}px ${PAD}px`,
						justifyContent: "space-between",
					}}
				>
					{/* Eyebrow + hero name */}
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div
							className="font-blockKie"
							style={{ fontSize: 22, letterSpacing: 4 }}
						>
							NEXT RACE
						</div>
						<div
							style={{
								display: "flex",
								height: 6,
								backgroundColor: "#000",
								margin: "8px 0 14px",
							}}
						/>
						<div
							className="font-blockKie"
							style={{ fontSize: 48, lineHeight: 1.04 }}
						>
							{raceName}
						</div>
						{round ? (
							<div
								className="font-blockKie"
								style={{ fontSize: 20, marginTop: 10, letterSpacing: 2 }}
							>
								ROUND {round}
							</div>
						) : null}
					</div>

					{/* Circuit + place */}
					<div style={{ display: "flex", flexDirection: "column" }}>
						{circuitName ? (
							<div className="font-blockKie" style={{ fontSize: 24 }}>
								{circuitName}
							</div>
						) : null}
						{place ? (
							<div
								className="font-blockKie"
								style={{ fontSize: 20, marginTop: 4 }}
							>
								{place}
							</div>
						) : null}
					</div>

					{/* Date + countdown */}
					<div style={{ display: "flex", flexDirection: "column" }}>
						{dateLabel ? (
							<div
								className="font-blockKie"
								style={{ fontSize: 22, letterSpacing: 2 }}
							>
								{dateLabel}
							</div>
						) : null}
						{countdown ? (
							<div
								style={{
									display: "flex",
									alignSelf: "flex-start",
									marginTop: 10,
									padding: "8px 16px",
									backgroundColor: "#000",
								}}
							>
								<div
									className="font-blockKie"
									style={{ fontSize: 28, color: "#fff", letterSpacing: 2 }}
								>
									{countdown}
								</div>
							</div>
						) : null}
					</div>
				</div>

				{/* RIGHT: circuit outline panel */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: PANEL,
						height,
						borderLeft: "4px solid #000",
						alignItems: "center",
						justifyContent: "center",
						padding: 24,
					}}
				>
					<svg
						width={PANEL - 56}
						height={height - 120}
						viewBox="0 0 100 100"
						preserveAspectRatio="xMidYMid meet"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>{circuitName || "Circuit"} outline</title>
						<path
							d={outlineFor(circuitId)}
							fill="none"
							stroke="#000"
							strokeWidth={4}
							strokeLinejoin="round"
							strokeLinecap="round"
						/>
						{/* Start/finish tick */}
						<path d={START_TICK} stroke="#000" strokeWidth={4} fill="none" />
					</svg>
					<div
						className="font-blockKie"
						style={{ fontSize: 18, marginTop: 12, letterSpacing: 2 }}
					>
						CIRCUIT
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
