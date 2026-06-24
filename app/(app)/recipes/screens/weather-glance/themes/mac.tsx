import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";
import type { WeatherGlanceData } from "../getData";

// ===========================================================================
// Weather (System) — a design probe styled after the original 1984 Macintosh
// System desk accessories: a draggable window with title-bar drag-stripes and
// a close box, a checkerboard desktop behind it, a hard 2px drop shadow, and
// chunky hand-drawn 1-bit weather glyphs. Pure #000 / #fff. Flexbox + inline
// SVG only (Satori/Takumi-safe — no grid, filter, gradient, shadow, opacity).
// ===========================================================================

type IconKind =
	| "sun"
	| "partly"
	| "cloud"
	| "rain"
	| "snow"
	| "fog"
	| "thunder";

function iconFor(code: number, isDay = true): IconKind {
	if (code === 0) return isDay ? "sun" : "sun"; // clear
	if (code === 1 || code === 2) return "partly"; // mainly clear / partly cloudy
	if (code === 3) return "cloud"; // overcast
	if (code === 45 || code === 48) return "fog"; // fog
	if (code >= 51 && code <= 67) return "rain"; // drizzle + rain (incl. freezing)
	if (code >= 71 && code <= 77) return "snow"; // snow fall / grains
	if (code >= 80 && code <= 82) return "rain"; // rain showers
	if (code === 85 || code === 86) return "snow"; // snow showers
	if (code >= 95) return "thunder"; // thunderstorm
	return "cloud";
}

// ---------------------------------------------------------------------------
// Mac weather glyph. Chunky, hand-drawn, MacPaint-style 1-bit line art:
// rounded-bump cloud bodies, a triangular-ray sun, diagonal rain, asterisk
// snow, a jagged bolt. Draws inside a `size` x `size` box on a 0..100 grid;
// `stroke` is the desired *rendered* px width and is converted to user space.
// ---------------------------------------------------------------------------

// A fat rounded cloud body, anchored lower so glyphs sit beneath it.
const CLOUD_PATH =
	"M28 68 " +
	"a18 18 0 0 1 -1 -34 " +
	"a22 22 0 0 1 42 -6 " +
	"a16 16 0 0 1 6 40 " +
	"Z";

function WeatherIcon({
	kind,
	size,
	stroke,
}: {
	kind: IconKind;
	size: number;
	stroke: number;
}) {
	const sw = (stroke / size) * 100;
	const common = {
		fill: "none",
		stroke: "#000",
		strokeWidth: sw,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	// Cloud body gets a white fill so overlapping sun rays are masked behind it.
	const cloudFilled = {
		fill: "#fff",
		stroke: "#000",
		strokeWidth: sw,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label={`${kind} weather`}
		>
			<title>{kind}</title>

			{kind === "sun" && (
				<g>
					{/* Triangular rays — the classic chunky Mac sunburst. */}
					{Array.from({ length: 8 }).map((_, i) => {
						const a = (Math.PI / 4) * i;
						const cx = 50;
						const cy = 50;
						const r0 = 30;
						const r1 = 47;
						const half = 5;
						const tx = cx + Math.cos(a) * r1;
						const ty = cy + Math.sin(a) * r1;
						const pa = a + Math.PI / 2;
						const bx = cx + Math.cos(a) * r0;
						const by = cy + Math.sin(a) * r0;
						const b1x = bx + Math.cos(pa) * half;
						const b1y = by + Math.sin(pa) * half;
						const b2x = bx - Math.cos(pa) * half;
						const b2y = by - Math.sin(pa) * half;
						return (
							<polygon
								key={`ray-${i}`}
								points={`${tx},${ty} ${b1x},${b1y} ${b2x},${b2y}`}
								fill="#000"
								stroke="#000"
								strokeWidth={sw * 0.5}
								strokeLinejoin="round"
							/>
						);
					})}
					<circle cx="50" cy="50" r="22" {...cloudFilled} />
				</g>
			)}

			{kind === "partly" && (
				<g>
					{/* Sun peeking top-left with little triangular rays. */}
					{Array.from({ length: 8 }).map((_, i) => {
						const a = (Math.PI / 4) * i;
						const cx = 36;
						const cy = 34;
						const r0 = 17;
						const r1 = 28;
						const half = 3.4;
						const tx = cx + Math.cos(a) * r1;
						const ty = cy + Math.sin(a) * r1;
						const pa = a + Math.PI / 2;
						const bx = cx + Math.cos(a) * r0;
						const by = cy + Math.sin(a) * r0;
						const b1x = bx + Math.cos(pa) * half;
						const b1y = by + Math.sin(pa) * half;
						const b2x = bx - Math.cos(pa) * half;
						const b2y = by - Math.sin(pa) * half;
						return (
							<polygon
								key={`pray-${i}`}
								points={`${tx},${ty} ${b1x},${b1y} ${b2x},${b2y}`}
								fill="#000"
							/>
						);
					})}
					<circle cx="36" cy="34" r="12" {...cloudFilled} />
					{/* Cloud in front, lower-right, white-filled to overlap the sun. */}
					<path
						d={
							"M40 82 " +
							"a16 16 0 0 1 -1 -30 " +
							"a20 20 0 0 1 38 -5 " +
							"a14 14 0 0 1 5 35 " +
							"Z"
						}
						{...cloudFilled}
					/>
				</g>
			)}

			{kind === "cloud" && <path d={CLOUD_PATH} {...cloudFilled} />}

			{kind === "fog" && (
				<g>
					<path d={CLOUD_PATH} {...cloudFilled} />
					<line x1="20" y1="80" x2="74" y2="80" {...common} />
					<line x1="28" y1="92" x2="82" y2="92" {...common} />
				</g>
			)}

			{kind === "rain" && (
				<g>
					<path d={CLOUD_PATH} {...cloudFilled} />
					<line x1="34" y1="74" x2="27" y2="94" {...common} />
					<line x1="50" y1="74" x2="43" y2="94" {...common} />
					<line x1="66" y1="74" x2="59" y2="94" {...common} />
				</g>
			)}

			{kind === "snow" && (
				<g>
					<path d={CLOUD_PATH} {...cloudFilled} />
					{[34, 52, 70].map((cx) => (
						<g key={cx}>
							<line x1={cx} y1="76" x2={cx} y2="94" {...common} />
							<line x1={cx - 7} y1="80" x2={cx + 7} y2="90" {...common} />
							<line x1={cx + 7} y1="80" x2={cx - 7} y2="90" {...common} />
						</g>
					))}
				</g>
			)}

			{kind === "thunder" && (
				<g>
					<path d={CLOUD_PATH} {...cloudFilled} />
					<polygon
						points="54,72 38,90 49,90 44,100 64,80 53,80"
						fill="#000"
						stroke="#000"
						strokeWidth={sw * 0.5}
						strokeLinejoin="round"
					/>
				</g>
			)}
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Title-bar drag stripes: the classic six horizontal lines of an active
// Mac window title bar. Drawn as inline SVG <line>s so they render crisply.
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

interface WgSystemProps extends WeatherGlanceData {
	width?: number;
	height?: number;
}

function WgSystem({
	location = "",
	current,
	today,
	daily = [],
	unitLabel = "°C",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WgSystemProps) {
	const deg = unitLabel;

	// --- Desktop geometry: the window floats on the dithered desktop with a
	// hard 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;

	// Shared desktop frame (checkerboard + drop-shadowed window shell).
	const Desktop = ({ children }: { children: React.ReactNode }) => (
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
						id="deskDither"
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
					fill="url(#deskDither)"
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
				{children}
			</div>
		</div>
	);

	// The window title bar: close box · stripes · centered white-boxed title.
	const TitleBar = () => (
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
			<div style={{ display: "flex", alignItems: "center", marginRight: 6 }}>
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
				}}
			>
				Weather
			</div>
			<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
				<DragStripes
					width={Math.max(10, Math.floor(winW * 0.32))}
					height={TITLE_H}
				/>
			</div>
			<div style={{ width: 14 + 6, display: "flex" }} />
		</div>
	);

	// --- Error / empty state: render the message centered inside the window. ---
	if (message || !current) {
		return (
			<PreSatori width={width} height={height}>
				<Desktop>
					<TitleBar />
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
						{message || "Weather unavailable right now."}
					</div>
				</Desktop>
			</PreSatori>
		);
	}

	// Forecast strip: next 4 days (skip "today" = index 0 when possible).
	const stripDays = (daily.length > 1 ? daily.slice(1) : daily).slice(0, 4);

	return (
		<PreSatori width={width} height={height}>
			<Desktop>
				<TitleBar />

				{/* Window content area. */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						padding: "10px 14px 12px",
						boxSizing: "border-box",
						backgroundColor: "#fff",
					}}
				>
					{/* Content title — the resolved location, drawn like a doc heading. */}
					<div
						className="font-geneva9"
						style={{
							display: "flex",
							fontSize: 18,
							borderBottom: "2px solid #000",
							paddingBottom: 4,
							marginBottom: 8,
						}}
					>
						{location || "—"}
					</div>

					{/* Hero row: a framed "current conditions" well on the left
					    (big glyph over the big temperature) and a readings
					    panel on the right. flex:1 so it fills the dead space. */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "stretch",
							flex: 1,
						}}
					>
						{/* Current-conditions well: glyph + temperature stacked,
						    boxed like an inset Mac control. */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								flex: 1,
								border: "2px solid #000",
								backgroundColor: "#fff",
								padding: "8px 14px",
								boxSizing: "border-box",
							}}
						>
							{/* The big weather glyph — the hero of the screen. */}
							<div style={{ display: "flex", marginRight: 16 }}>
								<WeatherIcon
									kind={iconFor(current.code, current.isDay)}
									size={150}
									stroke={5}
								/>
							</div>
							{/* Big current temperature in the chunky pixel face. */}
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 104,
									lineHeight: 1,
								}}
							>
								{current.temp}
								{deg}
							</div>
						</div>

						{/* Readings panel on the right — boxed, evenly spaced. */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								marginLeft: 8,
								padding: "10px 14px",
								border: "2px solid #000",
								backgroundColor: "#fff",
								boxSizing: "border-box",
							}}
						>
							<div
								className="font-geneva9"
								style={{ display: "flex", fontSize: 18, marginBottom: 10 }}
							>
								Feels {current.feelsLike}
								{deg}
							</div>
							<div
								className="font-geneva9"
								style={{ display: "flex", fontSize: 18, marginBottom: 10 }}
							>
								Wind {current.wind}
								{deg === "°F" ? " mph" : " km/h"}
							</div>
							{today && (
								<div
									className="font-geneva9"
									style={{
										display: "flex",
										fontSize: 18,
										borderTop: "2px solid #000",
										paddingTop: 10,
									}}
								>
									H {today.hi}
									{deg} L {today.lo}
									{deg}
								</div>
							)}
						</div>
					</div>

					{/* Forecast: a row of framed mini-windows (day / glyph / hi-lo). */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							marginTop: 10,
						}}
					>
						{stripDays.map((d, i) => (
							<div
								key={`${d.day}-${i}`}
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									marginLeft: i === 0 ? 0 : 8,
									border: "2px solid #000",
									backgroundColor: "#fff",
									boxSizing: "border-box",
								}}
							>
								{/* Mini title bar with its own drag stripes. */}
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										height: 16,
										borderBottom: "2px solid #000",
										position: "relative",
									}}
								>
									<div
										style={{
											display: "flex",
											position: "absolute",
											top: 0,
											left: 2,
										}}
									>
										<DragStripes width={18} height={16} />
									</div>
									<div
										className="font-geneva9"
										style={{
											display: "flex",
											fontSize: 15,
											backgroundColor: "#fff",
											padding: "0 6px",
										}}
									>
										{d.day || "—"}
									</div>
									<div
										style={{
											display: "flex",
											position: "absolute",
											top: 0,
											right: 2,
										}}
									>
										<DragStripes width={18} height={16} />
									</div>
								</div>

								{/* Glyph + hi/lo. */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										padding: "6px 2px 6px",
									}}
								>
									<div style={{ display: "flex" }}>
										<WeatherIcon kind={iconFor(d.code)} size={46} stroke={3} />
									</div>
									<div
										className="font-geneva9"
										style={{ display: "flex", fontSize: 17, marginTop: 4 }}
									>
										{d.hi}
										{deg}
									</div>
									<div
										className="font-geneva9"
										style={{ display: "flex", fontSize: 15 }}
									>
										{d.lo}
										{deg}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</Desktop>
		</PreSatori>
	);
}

export default WgSystem;
