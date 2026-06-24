import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// NASA APOD (Mac) — the Astronomy Picture of the Day restyled as a 1984
// Macintosh image-viewer window: a chrome window on the dithered desktop, the
// title bar carrying the photo's title, the photograph framed in an inset
// "well", and a bottom status-bar strip with the date + © credit. Pure
// #000 / #fff. Flexbox + inline SVG only (Takumi-safe). SVG children use <g>,
// never Fragment <>.
// ===========================================================================

// Truncate a single line so it fits a fixed-width strip without wrapping.
const clip = (s: string, max: number) =>
	s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s;

// Pick a UI font size for the title bar so long titles stay on one line.
function titleFontSize(text: string, boxW: number): number {
	// ~0.55em per glyph for Geneva-ish UI text; clamp to a legible band.
	const fit = Math.floor(boxW / Math.max(1, text.length * 0.55));
	return Math.max(15, Math.min(18, fit));
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

interface ApodMacProps {
	title?: string;
	imageUrl?: string;
	date?: string;
	copyright?: string;
	explanation?: string;
	message?: string;
	width?: number;
	height?: number;
}

function ApodMac({
	title = "",
	imageUrl = "",
	date = "",
	copyright,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: ApodMacProps) {
	// --- Desktop geometry: the window floats on the dithered desktop with a
	// hard 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;
	const STATUS_H = 26;

	// Title-bar text: the photo's title (clipped) or a generic fallback.
	const barText = title ? clip(title, 46) : "Astronomy Picture of the Day";
	// The white title box occupies the centre; estimate its usable width.
	const titleBoxW = Math.max(60, winW - 2 * Math.floor(winW * 0.18) - 40);
	const barFont = titleFontSize(barText, titleBoxW);

	// Shared desktop frame (checkerboard + drop-shadowed window shell) with a
	// titled title bar. Children render inside the window content area.
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
						id="apodDeskDither"
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
					fill="url(#apodDeskDither)"
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
				{/* Title bar: close box · stripes · centered white-boxed title. */}
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
							width={Math.max(10, Math.floor(winW * 0.18))}
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
							fontSize: barFont,
							height: TITLE_H - 4,
							whiteSpace: "nowrap",
						}}
					>
						{barText}
					</div>
					<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
						<DragStripes
							width={Math.max(10, Math.floor(winW * 0.18))}
							height={TITLE_H}
						/>
					</div>
					<div style={{ width: 14 + 6, display: "flex" }} />
				</div>

				{children}
			</div>
		</div>
	);

	// --- No-image / message state: render the message centered in the well. ---
	if (message && !imageUrl) {
		return (
			<PreSatori width={width} height={height}>
				<Shell>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							padding: 10,
							boxSizing: "border-box",
							backgroundColor: "#fff",
						}}
					>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								flex: 1,
								alignItems: "center",
								justifyContent: "center",
								border: "2px solid #000",
								backgroundColor: "#fff",
								boxSizing: "border-box",
								padding: 30,
								textAlign: "center",
								fontSize: 20,
								lineHeight: 1.3,
							}}
						>
							{message}
						</div>
					</div>
				</Shell>
			</PreSatori>
		);
	}

	// Status-bar text: date + © credit, document-window footer style.
	const credit = copyright ? `© ${copyright}` : "";

	return (
		<PreSatori width={width} height={height}>
			<Shell>
				{/* Window content area. */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						padding: 10,
						boxSizing: "border-box",
						backgroundColor: "#fff",
					}}
				>
					{/* The framed image well — an inset box holding the photograph,
					    object-fit cover, rendered as-is (no brightness tweaks). */}
					<div
						style={{
							display: "flex",
							flex: 1,
							border: "2px solid #000",
							backgroundColor: "#000",
							boxSizing: "border-box",
							overflow: "hidden",
							position: "relative",
						}}
					>
						{imageUrl ? (
							<img
								src={imageUrl}
								alt={title || "NASA Astronomy Picture of the Day"}
								width={winW - 24}
								height={winH - TITLE_H - STATUS_H - 24}
								style={{
									width: winW - 24,
									height: winH - TITLE_H - STATUS_H - 24,
									objectFit: "cover",
								}}
							/>
						) : null}
					</div>

					{/* Status-bar strip: date on the left, © credit on the right —
					    the classic Mac document-window footer. */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							height: STATUS_H,
							marginTop: 8,
							border: "2px solid #000",
							backgroundColor: "#fff",
							padding: "0 10px",
							boxSizing: "border-box",
						}}
					>
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 16,
								whiteSpace: "nowrap",
							}}
						>
							{date || "—"}
						</div>
						{credit ? (
							<div
								className="font-geneva9"
								style={{
									display: "flex",
									fontSize: 16,
									whiteSpace: "nowrap",
									overflow: "hidden",
									marginLeft: 12,
								}}
							>
								{clip(credit, 40)}
							</div>
						) : null}
					</div>
				</div>
			</Shell>
		</PreSatori>
	);
}

export default ApodMac;
