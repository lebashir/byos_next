import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster NASA APOD (Müller-Brockmann in 1-bit). A bold poster:
// an enormous reversed-out title bar pinned to the top, the photo dropped into a
// big thick-outlined box as the dominant visual, and a black footer bar carrying
// the date + © credit reversed out in white. The page stays PREDOMINANTLY WHITE
// — black is reserved for the two bars and the thick outline around the photo —
// so the e-ink panel stays balanced and ghost-free. The photo box IS the main
// visual; we add no extra big black fills.
// Pure #000 / #fff. Flexbox + inline SVG only — no grid, filter, gradient,
// shadow or opacity — so it survives the takumi/Satori renderer. SVG children
// are wrapped in <g>, never a React Fragment (takumi drops Fragment-wrapped SVG
// nodes).
// ---------------------------------------------------------------------------

interface ApodBrutalProps {
	title?: string;
	imageUrl?: string;
	date?: string;
	copyright?: string;
	explanation?: string;
	message?: string;
	width?: number;
	height?: number;
}

// Size the HUGE title so the WHOLE thing fits inside the top bar — long titles
// step the font down and wrap to two lines rather than getting sheared off at
// the edge. Never truncate.
function titleFontSize(s: string): number {
	const n = s.length;
	if (n <= 12) return 70;
	if (n <= 18) return 58;
	if (n <= 26) return 48;
	if (n <= 36) return 38;
	if (n <= 50) return 30;
	return 24;
}

// Tiny inline star-burst mark for the footer — a flat brutalist asterisk, drawn
// in solid white so it reads on the black bar. Pure solid shapes, no strokes.
function StarMark({ size, ink }: { size: number; ink: string }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="star"
		>
			<title>star</title>
			<g>
				<rect x="44" y="8" width="12" height="84" fill={ink} />
				<rect x="8" y="44" width="84" height="12" fill={ink} />
				<polygon points="22,18 32,12 88,68 78,78" fill={ink} />
				<polygon points="78,18 88,28 28,88 18,78" fill={ink} />
			</g>
		</svg>
	);
}

function ApodBrutal({
	title = "",
	imageUrl = "",
	date = "",
	copyright,
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: ApodBrutalProps) {
	// --- Empty / non-image state: message centred, black on white. ---
	if (message && !imageUrl) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black font-blockKie"
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						width,
						height,
						backgroundColor: "#fff",
						color: "#000",
						padding: 48,
						textAlign: "center",
						boxSizing: "border-box",
					}}
				>
					{title ? (
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								fontSize: 40,
								lineHeight: 1.05,
								marginBottom: 18,
							}}
						>
							{title.toUpperCase()}
						</div>
					) : null}
					<div
						className="font-blockKie"
						style={{ display: "flex", fontSize: 30, lineHeight: 1.15 }}
					>
						{message}
					</div>
					{date ? (
						<div
							className="font-geneva9"
							style={{ display: "flex", fontSize: 16, marginTop: 18 }}
						>
							{date}
						</div>
					) : null}
				</div>
			</PreSatori>
		);
	}

	const RULE = 7; // thick black rule / outline
	const upperTitle = (title || "ASTRONOMY PICTURE OF THE DAY").toUpperCase();
	const credit = copyright ? `© ${copyright}` : "NASA / APOD";

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
				{/* ============ BLACK TITLE BAR (the main ink accent) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						backgroundColor: "#000",
						paddingTop: 12,
						paddingBottom: 12,
						paddingLeft: 22,
						paddingRight: 22,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: titleFontSize(upperTitle),
							lineHeight: 1.0,
							letterSpacing: -1,
							overflow: "hidden",
						}}
					>
						{upperTitle}
					</div>
				</div>

				{/* thick rule under the title bar */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== PHOTO BOX (dominant visual) ===================== */}
				<div
					style={{
						display: "flex",
						flex: 1,
						minHeight: 0,
						padding: 14,
						boxSizing: "border-box",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							display: "flex",
							flex: 1,
							minWidth: 0,
							minHeight: 0,
							border: `${RULE}px solid #000`,
							boxSizing: "border-box",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "#fff",
							overflow: "hidden",
						}}
					>
						{imageUrl ? (
							<img
								src={imageUrl}
								alt={title || "NASA Astronomy Picture of the Day"}
								width={width}
								height={height}
								style={{
									display: "flex",
									width: "100%",
									height: "100%",
									objectFit: "cover",
								}}
							/>
						) : null}
					</div>
				</div>

				{/* thick rule above the footer bar */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ============ BLACK FOOTER BAR (date + © reversed out) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						backgroundColor: "#000",
						paddingTop: 10,
						paddingBottom: 10,
						paddingLeft: 18,
						paddingRight: 18,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					{/* DATE — big, reversed out white */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							minWidth: 0,
							overflow: "hidden",
						}}
					>
						<div style={{ display: "flex", flexShrink: 0, marginRight: 12 }}>
							<StarMark size={26} ink="#fff" />
						</div>
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								color: "#fff",
								fontSize: 30,
								lineHeight: 1,
								letterSpacing: 1,
								overflow: "hidden",
							}}
						>
							{date || "TODAY"}
						</div>
					</div>

					{/* CREDIT — smaller, reversed out white */}
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: 22,
							lineHeight: 1,
							marginLeft: 16,
							flexShrink: 0,
							overflow: "hidden",
						}}
					>
						{credit}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

export default ApodBrutal;
