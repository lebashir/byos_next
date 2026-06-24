import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ---------------------------------------------------------------------------
// Brutalist / Swiss-poster weather (Müller-Brockmann in 1-bit). Oversized type,
// thick rules, an enormous temperature figure — but on a PREDOMINANTLY WHITE
// page, with black used as bold accents (a header bar, one solid block, thick
// rules) so the e-ink panel stays balanced and ghost-free.
// Pure #000 / #fff. Flexbox + inline SVG (solid fills only) — no grid, filter,
// gradient, shadow or opacity, so it survives the takumi/Satori renderer.
// ---------------------------------------------------------------------------

type DailyEntry = { day: string; hi: number; lo: number; code: number };

interface WgBrutalProps {
	location?: string;
	current?: {
		temp: number;
		feelsLike: number;
		code: number;
		wind: number;
		isDay: boolean;
	};
	today?: { hi: number; lo: number };
	daily?: DailyEntry[];
	unitLabel?: string;
	message?: string;
	width?: number;
	height?: number;
}

type Glyph = "sun" | "cloud" | "rain" | "snow" | "fog" | "thunder";

function glyphFor(code: number): Glyph {
	if (code === 0) return "sun"; // clear
	if (code >= 1 && code <= 3) return "cloud"; // partly cloudy / overcast
	if (code === 45 || code === 48) return "fog"; // fog
	if (code >= 51 && code <= 67) return "rain"; // drizzle + rain
	if (code >= 71 && code <= 77) return "snow"; // snow
	if (code >= 80 && code <= 82) return "rain"; // showers
	if (code === 85 || code === 86) return "snow"; // snow showers
	if (code >= 95) return "thunder"; // thunderstorm
	return "cloud";
}

// Flat geometric weather glyph — SOLID black or white shapes, no strokes, no
// curves where a hard edge will do. `ink` is the figure colour (so it can be
// reversed out on a black block).
function WeatherGlyph({
	kind,
	size,
	ink,
}: {
	kind: Glyph;
	size: number;
	ink: string;
}) {
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
				<>
					{/* solid disc + chunky square rays */}
					<circle cx="50" cy="50" r="22" fill={ink} />
					<rect x="46" y="6" width="8" height="16" fill={ink} />
					<rect x="46" y="78" width="8" height="16" fill={ink} />
					<rect x="6" y="46" width="16" height="8" fill={ink} />
					<rect x="78" y="46" width="16" height="8" fill={ink} />
					<rect x="18" y="18" width="14" height="8" fill={ink} />
					<rect x="68" y="74" width="14" height="8" fill={ink} />
					<rect x="68" y="18" width="14" height="8" fill={ink} />
					<rect x="18" y="74" width="14" height="8" fill={ink} />
				</>
			)}

			{kind === "cloud" && (
				<>
					{/* cloud as overlapping solid blocks/discs */}
					<circle cx="36" cy="50" r="20" fill={ink} />
					<circle cx="62" cy="44" r="24" fill={ink} />
					<rect x="30" y="50" width="48" height="22" fill={ink} />
				</>
			)}

			{kind === "rain" && (
				<>
					<circle cx="36" cy="38" r="18" fill={ink} />
					<circle cx="60" cy="32" r="22" fill={ink} />
					<rect x="28" y="38" width="46" height="20" fill={ink} />
					{/* slanted bars of rain */}
					<rect x="32" y="66" width="7" height="26" fill={ink} />
					<rect x="50" y="66" width="7" height="26" fill={ink} />
					<rect x="68" y="66" width="7" height="26" fill={ink} />
				</>
			)}

			{kind === "snow" && (
				<>
					<circle cx="36" cy="38" r="18" fill={ink} />
					<circle cx="60" cy="32" r="22" fill={ink} />
					<rect x="28" y="38" width="46" height="20" fill={ink} />
					{/* blocky flakes */}
					<rect x="32" y="70" width="10" height="10" fill={ink} />
					<rect x="50" y="78" width="10" height="10" fill={ink} />
					<rect x="68" y="70" width="10" height="10" fill={ink} />
				</>
			)}

			{kind === "fog" && (
				<>
					<circle cx="36" cy="34" r="16" fill={ink} />
					<circle cx="60" cy="30" r="20" fill={ink} />
					<rect x="28" y="34" width="44" height="16" fill={ink} />
					{/* heavy fog bars */}
					<rect x="18" y="62" width="64" height="8" fill={ink} />
					<rect x="28" y="78" width="64" height="8" fill={ink} />
				</>
			)}

			{kind === "thunder" && (
				<>
					<circle cx="36" cy="34" r="17" fill={ink} />
					<circle cx="60" cy="28" r="21" fill={ink} />
					<rect x="28" y="34" width="46" height="18" fill={ink} />
					{/* solid lightning bolt */}
					<polygon
						points="54,56 36,84 50,84 42,100 72,68 56,68 66,56"
						fill={ink}
					/>
				</>
			)}
		</svg>
	);
}

// Size the reversed-out headline so the WHOLE location fits inside the black
// bar — long "City, Country" strings step the font down and wrap to two lines
// rather than getting sheared off at the edge.
function headerFontSize(s: string): number {
	const n = s.length;
	if (n <= 10) return 60;
	if (n <= 16) return 48;
	if (n <= 24) return 36;
	return 28;
}

export default function WgBrutal({
	location = "",
	current,
	today,
	daily = [],
	unitLabel = "°C",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WgBrutalProps) {
	const deg = unitLabel; // "°C" | "°F"

	// --- Empty / error state: a single black-on-white slogan, dead centre. ---
	if (message || !current) {
		return (
			<PreSatori width={width} height={height}>
				<div
					className="bg-white text-black font-blockKie"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width,
						height,
						padding: 48,
						textAlign: "center",
						boxSizing: "border-box",
					}}
				>
					<div
						className="font-blockKie"
						style={{ fontSize: 46, lineHeight: 1.05, display: "flex" }}
					>
						{message || "NO SIGNAL"}
					</div>
				</div>
			</PreSatori>
		);
	}

	const HEADER_H = 84;
	const RULE = 7; // thick black rule
	const headlineUpper = (location || "—").toUpperCase();
	const headlineSize = headerFontSize(headlineUpper);

	// Forecast strip: skip "today" (index 0) when we have more days.
	const stripDays = (daily.length > 1 ? daily.slice(1) : daily).slice(0, 4);

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-blockKie"
				style={{
					display: "flex",
					flexDirection: "column",
					width,
					height,
					boxSizing: "border-box",
				}}
			>
				{/* ============ BLACK HEADER BAR (the main ink accent) ============ */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						height: HEADER_H,
						backgroundColor: "#000",
						paddingLeft: 22,
						paddingRight: 22,
						boxSizing: "border-box",
						overflow: "hidden",
						flexShrink: 0,
					}}
				>
					{/* LOCATION reversed out white — sized + wrapped so it fits whole */}
					<div
						className="font-blockKie"
						style={{
							display: "flex",
							color: "#fff",
							fontSize: headlineSize,
							lineHeight: 1.02,
							letterSpacing: -1,
							overflow: "hidden",
						}}
					>
						{headlineUpper}
					</div>
				</div>

				{/* thick rule under the header block */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== ENORMOUS TEMPERATURE ===================== */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						minHeight: 0,
						overflow: "hidden",
					}}
				>
					{/* Left: the figure itself, bleeding off the left edge. */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							flex: 1,
							minWidth: 0,
							paddingLeft: 8,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "flex-start",
							}}
						>
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 220,
									lineHeight: 0.82,
									letterSpacing: -8,
									marginTop: -8,
								}}
							>
								{current.temp}
							</div>
							{/* small unit stacked at the top of the figure */}
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									fontSize: 44,
									lineHeight: 1,
									marginTop: 14,
								}}
							>
								{deg}
							</div>
						</div>

						{/* tiny label row under the figure */}
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								fontSize: 15,
								marginTop: 6,
								paddingLeft: 6,
							}}
						>
							FEELS {current.feelsLike}
							{deg} · WIND {current.wind}
							{deg === "°F" ? " MPH" : " KM/H"}
							{today ? ` · HI ${today.hi}${deg} LO ${today.lo}${deg}` : ""}
						</div>
					</div>

					{/* Right rail: thick vertical rule + a WHITE glyph panel — the
					    weather mark sits black-on-white (no big black fill here),
					    keeping the page light beside the temperature. */}
					<div
						style={{
							display: "flex",
							width: RULE,
							backgroundColor: "#000",
							flexShrink: 0,
						}}
					/>
					<div
						style={{
							display: "flex",
							width: 168,
							backgroundColor: "#fff",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
							overflow: "hidden",
						}}
					>
						<WeatherGlyph kind={glyphFor(current.code)} size={130} ink="#000" />
					</div>
				</div>

				{/* thick rule above the forecast row */}
				<div style={{ height: RULE, backgroundColor: "#000", flexShrink: 0 }} />

				{/* ===================== FORECAST BLOCK ROW ===================== */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						height: 150,
						flexShrink: 0,
					}}
				>
					{stripDays.map((d, i) => {
						const inverted = i === 0; // ONE solid-black block among outlined ones
						const ink = inverted ? "#fff" : "#000";
						const last = i === stripDays.length - 1;
						return (
							<div
								key={`${d.day}-${i}`}
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "flex-start",
									justifyContent: "space-between",
									flex: 1,
									height: 150,
									boxSizing: "border-box",
									padding: "10px 10px 8px 12px",
									backgroundColor: inverted ? "#000" : "#fff",
									color: ink,
									// One solid-black cell; the rest are WHITE with a full
									// thick black outline (4px box around each).
									borderTop: "4px solid #000",
									borderBottom: inverted ? "none" : "4px solid #000",
									borderLeft: inverted ? "none" : "4px solid #000",
									borderRight: last ? "none" : "4px solid #000",
								}}
							>
								{/* DAY */}
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										fontSize: 30,
										lineHeight: 1,
										color: ink,
									}}
								>
									{(d.day || "—").toUpperCase()}
								</div>

								{/* flat geometric glyph */}
								<div style={{ display: "flex" }}>
									<WeatherGlyph kind={glyphFor(d.code)} size={46} ink={ink} />
								</div>

								{/* HI / LO */}
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "flex-end",
										color: ink,
									}}
								>
									<div
										style={{
											display: "flex",
											fontSize: 34,
											lineHeight: 1,
										}}
									>
										{d.hi}
									</div>
									<div
										className="font-geneva9"
										style={{
											display: "flex",
											fontSize: 15,
											marginLeft: 6,
											marginBottom: 4,
										}}
									>
										/{d.lo}
										{deg}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</PreSatori>
	);
}
