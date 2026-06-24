import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// F1 Next Race (Mac) — the upcoming Grand Prix restyled as a 1984 Macintosh
// "race info" window: a chrome window on the dithered desktop, the race name
// big over Mac label-rows (ROUND / CIRCUIT / LOCATION), a date + computed
// countdown, and a chunky MacPaint-style track-loop motif framed in an inset
// "well". Pure #000 / #fff. Flexbox + inline SVG only (Takumi-safe). SVG
// children use <g>, never Fragment <>.
// ===========================================================================

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

// Whole-day countdown from now, computed via new Date() against calendar
// midnight so "TODAY"/"TOMORROW" line up with the race date.
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
	if (days === 1) return "TOMORROW";
	return `IN ${days} DAYS`;
}

// Size a hero string down so a long Grand Prix name stays inside the window.
function heroFontSize(text: string, boxW: number): number {
	// ~0.62em per glyph in the chunky pixel face; clamp to a legible band.
	const fit = Math.floor(boxW / Math.max(1, text.length * 0.62));
	return Math.max(20, Math.min(40, fit));
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

// ---------------------------------------------------------------------------
// A chunky MacPaint-style track-loop motif — NOT the real circuit. A fat
// rounded racing loop with a couple of kinks, a thick black stroke, plus a
// start/finish gate drawn as a little checkered bar. Lives on a 0..100 grid.
// ---------------------------------------------------------------------------
const TRACK_LOOP =
	"M30 24 " +
	"L66 24 " +
	"Q80 24 80 38 " +
	"L80 46 " +
	"Q80 56 70 58 " +
	"L46 60 " +
	"Q36 62 40 70 " +
	"Q44 80 32 80 " +
	"L26 80 " +
	"Q14 80 14 66 " +
	"L14 40 " +
	"Q14 24 30 24 " +
	"Z";

function TrackMotif({ size }: { size: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>race track</title>
			<g>
				{/* The fat track loop — drawn as a wide grey-less black ribbon by
				    stroking thickly. */}
				<path
					d={TRACK_LOOP}
					fill="none"
					stroke="#000"
					strokeWidth={11}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				{/* A thin white centre-line to read as a road. */}
				<path
					d={TRACK_LOOP}
					fill="none"
					stroke="#fff"
					strokeWidth={2}
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				{/* Start/finish gate — a chunky checkered bar across the top straight. */}
				<rect
					x="40"
					y="14"
					width="20"
					height="9"
					fill="#fff"
					stroke="#000"
					strokeWidth="2"
				/>
				<rect x="42" y="16" width="4" height="2.5" fill="#000" />
				<rect x="50" y="16" width="4" height="2.5" fill="#000" />
				<rect x="46" y="18.5" width="4" height="2.5" fill="#000" />
				<rect x="54" y="18.5" width="4" height="2.5" fill="#000" />
			</g>
		</svg>
	);
}

interface F1MacProps {
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

function F1Mac({
	raceName = "",
	round = "",
	circuitName = "",
	country = "",
	locality = "",
	dateISO = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: F1MacProps) {
	// --- Desktop geometry: the window floats on the dithered desktop with a
	// hard 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;

	// Shared desktop frame (checkerboard + drop-shadowed window shell) with a
	// titled "Next Race" title bar. Children render inside the content area.
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
						id="f1DeskDither"
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
					fill="url(#f1DeskDither)"
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
				{/* Title bar: close box · stripes · centered "Next Race" title. */}
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
							width={Math.max(10, Math.floor(winW * 0.32))}
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
						Next Race
					</div>
					<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
						<DragStripes
							width={Math.max(10, Math.floor(winW * 0.32))}
							height={TITLE_H}
						/>
					</div>
					<div style={{ width: 14 + 6, display: "flex" }} />
				</div>

				{children}
			</div>
		</div>
	);

	// --- Message state: render the message centered inside the window. ---
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

	const dateLabel = formatDate(dateISO);
	const countdown = countdownLabel(dateISO);
	const place = [locality, country].filter(Boolean).join(", ");

	// Left info column ~62%, the track-motif well ~38%.
	const WELL_W = Math.round(winW * 0.38);
	const INFO_W = winW - WELL_W;
	const heroFont = heroFontSize(raceName, INFO_W - 48);

	// A single Mac "label row": a fixed-width caption, then the value.
	const LabelRow = ({ label, value }: { label: string; value: string }) => (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "baseline",
				marginBottom: 7,
			}}
		>
			<div
				className="font-geneva9"
				style={{
					display: "flex",
					width: 78,
					fontSize: 15,
					flexShrink: 0,
				}}
			>
				{label}
			</div>
			<div
				className="font-geneva9"
				style={{
					display: "flex",
					flex: 1,
					fontSize: 17,
					overflow: "hidden",
					whiteSpace: "nowrap",
				}}
			>
				{value || "—"}
			</div>
		</div>
	);

	return (
		<PreSatori width={width} height={height}>
			<Shell>
				{/* Window content: info column (left) + track-motif well (right). */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						padding: 12,
						boxSizing: "border-box",
						backgroundColor: "#fff",
					}}
				>
					{/* LEFT: the race information column. */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: INFO_W,
							flexShrink: 0,
							justifyContent: "space-between",
						}}
					>
						{/* Hero name, with an underline rule like a doc heading. */}
						<div style={{ display: "flex", flexDirection: "column" }}>
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: heroFont,
									lineHeight: 1.05,
								}}
							>
								{raceName || "—"}
							</div>
							<div
								style={{
									display: "flex",
									height: 0,
									borderBottom: "2px solid #000",
									marginTop: 8,
									marginBottom: 10,
								}}
							/>
						</div>

						{/* Mac label rows. */}
						<div style={{ display: "flex", flexDirection: "column" }}>
							<LabelRow label="ROUND" value={round} />
							<LabelRow label="CIRCUIT" value={circuitName} />
							<LabelRow label="LOCATION" value={place} />
						</div>

						{/* Date + countdown footer. */}
						<div style={{ display: "flex", flexDirection: "column" }}>
							{dateLabel ? (
								<div
									className="font-geneva9"
									style={{
										display: "flex",
										fontSize: 16,
										marginBottom: 8,
									}}
								>
									{dateLabel}
								</div>
							) : null}
							{countdown ? (
								<div
									style={{
										display: "flex",
										alignSelf: "flex-start",
										backgroundColor: "#000",
										padding: "5px 14px",
									}}
								>
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											fontSize: 24,
											color: "#fff",
											lineHeight: 1,
										}}
									>
										{countdown}
									</div>
								</div>
							) : null}
						</div>
					</div>

					{/* RIGHT: the track-motif well — an inset framed box with a
					    chunky MacPaint loop and a CIRCUIT caption. */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: WELL_W,
							marginLeft: 12,
							border: "2px solid #000",
							backgroundColor: "#fff",
							boxSizing: "border-box",
							alignItems: "center",
							justifyContent: "center",
							padding: 12,
						}}
					>
						<div style={{ display: "flex" }}>
							<TrackMotif size={Math.min(WELL_W - 36, winH - TITLE_H - 90)} />
						</div>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 15,
								marginTop: 10,
							}}
						>
							CIRCUIT
						</div>
					</div>
				</div>
			</Shell>
		</PreSatori>
	);
}

export default F1Mac;
