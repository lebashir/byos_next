import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// NASA-APOD-ALMANAC — the Astronomy Picture of the Day rendered as a page from
// an antique celestial almanac: an astronomical "plate" with engraving frame,
// a dateline of observation, and a colophon crediting the observer.
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic, matching wg-almanac:
//   • double-rule page frame, centered masthead, ✦/✱ ornament dividers
//   • framed engraving plate holding the photograph, geneva9 small-caps labels
//   • italic explanation as the astronomer's note, geneva9 colophon footer
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
//   • SVG children grouped in <g>, never a React Fragment (takumi drops those)
// ===========================================================================

interface ApodAlmanacProps {
	title?: string;
	imageUrl?: string;
	date?: string;
	copyright?: string;
	explanation?: string;
	message?: string;
	width?: number;
	height?: number;
}

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// Trim the explanation to roughly two lines of italic note.
const clip = (s: string, max: number) =>
	s.length > max ? `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…` : s;

// Format an APOD date (YYYY-MM-DD) into a dateline, e.g.
// "WEDNESDAY, JUNE 24, 2026". Falls back to today's date when blank.
function datelineFor(date: string): string {
	try {
		const d = date ? new Date(`${date}T00:00:00`) : new Date();
		if (Number.isNaN(d.getTime())) return "";
		return new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		})
			.format(d)
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

// Corner registration ticks for the engraving plate.
function PlateCorners() {
	const L = 12;
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

export default function ApodAlmanac({
	title = "",
	imageUrl = "",
	date = "",
	copyright,
	explanation = "",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: ApodAlmanacProps) {
	const FRAME = 8;
	const RULE_GAP = 8;
	const innerPad = FRAME + 2 + RULE_GAP + 1;
	const contentW = width - innerPad * 2;
	const dateline = datelineFor(date);

	// ----- empty / error state — render the message centered, still framed. ---
	if (message && !imageUrl) {
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

	// blockKie is a wide display face; scale the photo title to fit one line.
	const titleText = title || "—";
	const titleFontSize = Math.max(
		20,
		Math.min(40, (contentW - 32) / (titleText.length * 0.62)),
	);

	const note = explanation ? clip(explanation.trim(), 150) : "";

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
							THE CELESTIAL ALMANAC
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: titleFontSize,
								lineHeight: 1.05,
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							{titleText}
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
								<div style={{ display: "flex" }}>CELESTIAL OBSERVATIONS</div>
							</div>
						) : null}

						{/* ============ ornament ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ================= ENGRAVING PLATE ================= */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								border: "1.5px solid #000",
								boxSizing: "border-box",
								padding: 8,
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
							{/* the photographic plate itself */}
							<div
								style={{
									display: "flex",
									flex: 1,
									overflow: "hidden",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={title || "Astronomical plate"}
										width={contentW}
										height={height}
										style={{
											width: "100%",
											height: "100%",
											objectFit: "cover",
										}}
									/>
								) : (
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											fontSize: 22,
											textAlign: "center",
											lineHeight: 1.3,
											padding: 24,
										}}
									>
										{message || "No plate recorded for this date."}
									</div>
								)}
							</div>
						</div>

						{/* ============ ornament before the astronomer's note ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ================= ASTRONOMER'S NOTE (explanation) ================= */}
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
								{note ? `“${note}”` : "No observations recorded."}
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
							<div style={{ display: "flex" }}>
								{copyright ? `© ${copyright.toUpperCase()}` : "PUBLIC DOMAIN"}
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
