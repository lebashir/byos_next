import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// WG-ALMANAC — a "Weather (Almanac)" design probe.
//
// Vintage broadsheet / Old Farmer's Almanac aesthetic: a page from an antique
// printed weather almanac — typographic, dense, ornamented, editorial.
//
// Pure #000 on #fff. Flexbox + inline SVG only (Satori/takumi safe):
//   • no css grid, no `filter`, no `-webkit-box`
//   • no gradients, shadows, or opacity
//   • strokes >= 1.5px, text >= 15px
// ===========================================================================

type DailyEntry = {
	day: string;
	hi: number;
	lo: number;
	code: number;
};

interface WgAlmanacProps {
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

// ---------------------------------------------------------------------------
// WMO weather_code → a short almanac-style description + an engraving glyph.
// 0 clear · 1-3 partly cloudy · 45/48 fog · 51-67 rain · 71-77 snow
// 80-82 showers · 95-99 thunder
// ---------------------------------------------------------------------------

type GlyphKind =
	| "sun"
	| "partly"
	| "cloud"
	| "rain"
	| "snow"
	| "fog"
	| "thunder";

function kindFor(code: number): GlyphKind {
	if (code === 0) return "sun";
	if (code === 1 || code === 2) return "partly";
	if (code === 3) return "cloud";
	if (code === 45 || code === 48) return "fog";
	if (code >= 51 && code <= 67) return "rain";
	if (code >= 71 && code <= 77) return "snow";
	if (code >= 80 && code <= 82) return "rain";
	if (code === 85 || code === 86) return "snow";
	if (code >= 95) return "thunder";
	return "cloud";
}

// Terse, period-flavoured prose for the lead block.
function prose(code: number, isDay: boolean): string {
	const k = kindFor(code);
	switch (k) {
		case "sun":
			return isDay ? "Fair & clear skies" : "Clear & starlit";
		case "partly":
			return "Sun amid passing clouds";
		case "cloud":
			return "Overcast & grey";
		case "fog":
			return "Thick fog abroad";
		case "rain":
			return "Rain, bring an umbrella";
		case "snow":
			return "Snow falling";
		case "thunder":
			return "Thunder & tempest";
		default:
			return "Changeable weather";
	}
}

// A compact ALL-CAPS sky word for the forecast table.
function skyWord(code: number): string {
	const k = kindFor(code);
	switch (k) {
		case "sun":
			return "FAIR";
		case "partly":
			return "CLOUDS";
		case "cloud":
			return "GREY";
		case "fog":
			return "FOG";
		case "rain":
			return "RAIN";
		case "snow":
			return "SNOW";
		case "thunder":
			return "STORM";
		default:
			return "VAR.";
	}
}

// ---------------------------------------------------------------------------
// Engraving-style line glyphs. Each draws inside a `size` x `size` box; the
// `stroke` is given in px and converted into the 0..100 user space so the
// *rendered* stroke stays consistent regardless of `size`.
// ---------------------------------------------------------------------------

const CLOUD_PATH =
	"M30 64 a16 16 0 0 1 -1 -32 a20 20 0 0 1 38 -6 a14 14 0 0 1 5 38 Z";

function Glyph({
	kind,
	size,
	stroke,
}: {
	kind: GlyphKind;
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
	const cloud = <path d={CLOUD_PATH} {...common} />;

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
					<circle cx="50" cy="50" r="17" {...common} />
					<line x1="50" y1="13" x2="50" y2="25" {...common} />
					<line x1="50" y1="75" x2="50" y2="87" {...common} />
					<line x1="13" y1="50" x2="25" y2="50" {...common} />
					<line x1="75" y1="50" x2="87" y2="50" {...common} />
					<line x1="24" y1="24" x2="33" y2="33" {...common} />
					<line x1="67" y1="67" x2="76" y2="76" {...common} />
					<line x1="76" y1="24" x2="67" y2="33" {...common} />
					<line x1="33" y1="67" x2="24" y2="76" {...common} />
				</g>
			)}

			{kind === "partly" && (
				<g>
					<circle cx="35" cy="33" r="12" {...common} />
					<line x1="35" y1="11" x2="35" y2="18" {...common} />
					<line x1="13" y1="33" x2="20" y2="33" {...common} />
					<line x1="19" y1="17" x2="24" y2="22" {...common} />
					<line x1="51" y1="17" x2="46" y2="22" {...common} />
					<path
						d={
							"M40 76 a14 14 0 0 1 -1 -28 a18 18 0 0 1 34 -5 a12 12 0 0 1 4 33 Z"
						}
						fill="#fff"
						stroke="#000"
						strokeWidth={sw}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</g>
			)}

			{kind === "cloud" && cloud}

			{kind === "fog" && (
				<g>
					{cloud}
					<line x1="22" y1="76" x2="74" y2="76" {...common} />
					<line x1="30" y1="88" x2="82" y2="88" {...common} />
				</g>
			)}

			{kind === "rain" && (
				<g>
					{cloud}
					<line x1="34" y1="72" x2="29" y2="88" {...common} />
					<line x1="50" y1="72" x2="45" y2="88" {...common} />
					<line x1="66" y1="72" x2="61" y2="88" {...common} />
				</g>
			)}

			{kind === "snow" && (
				<>
					{cloud}
					{[34, 52, 70].map((cx) => (
						<g key={cx}>
							<line x1={cx} y1="76" x2={cx} y2="90" {...common} />
							<line x1={cx - 6} y1="79" x2={cx + 6} y2="87" {...common} />
							<line x1={cx + 6} y1="79" x2={cx - 6} y2="87" {...common} />
						</g>
					))}
				</>
			)}

			{kind === "thunder" && (
				<g>
					{cloud}
					<polyline points="52,70 40,88 50,88 42,98" {...common} />
				</g>
			)}
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Ornaments built from inline SVG (no CSS tricks).
// ---------------------------------------------------------------------------

// A centered decorative divider: hairline — diamond+asterisk — hairline.
function OrnDivider({ width, h = 14 }: { width: number; h?: number }) {
	const cx = width / 2;
	const mid = h / 2;
	const gap = 26; // half-gap around the central motif
	return (
		<div style={{ display: "flex" }}>
			<svg
				width={width}
				height={h}
				viewBox={`0 0 ${width} ${h}`}
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>ornament</title>
				{/* left + right hairlines */}
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
				{/* small flanking diamonds */}
				<path d={`M${cx - gap + 6} ${mid} l4 -4 l4 4 l-4 4 Z`} fill="#000" />
				<path d={`M${cx + gap - 6} ${mid} l4 -4 l4 4 l-4 4 Z`} fill="#000" />
				{/* central asterisk */}
				<g stroke="#000" strokeWidth={1.8} strokeLinecap="round">
					<line x1={cx} y1={mid - 5} x2={cx} y2={mid + 5} />
					<line x1={cx - 5} y1={mid - 2.5} x2={cx + 5} y2={mid + 2.5} />
					<line x1={cx + 5} y1={mid - 2.5} x2={cx - 5} y2={mid + 2.5} />
				</g>
			</svg>
		</div>
	);
}

// A fine diagonal-hatch swatch used to add engraving "tone" behind a number.
function Hatch({ w, h, step = 6 }: { w: number; h: number; step?: number }) {
	const lines: number[] = [];
	for (let x = -h; x < w; x += step) lines.push(x);
	return (
		<svg
			width={w}
			height={h}
			viewBox={`0 0 ${w} ${h}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>hatching</title>
			{lines.map((x) => (
				<line
					key={x}
					x1={x}
					y1={h}
					x2={x + h}
					y2={0}
					stroke="#000"
					strokeWidth={1.5}
				/>
			))}
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Small composite helpers.
// ---------------------------------------------------------------------------

const SCAPS = {
	fontFeatureSettings: '"smcp" 1',
	letterSpacing: 2,
} as const;

// Today's dateline, e.g. "MONDAY, JUNE 23, 2026".
function todayLabel(): string {
	try {
		const fmt = new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		}).format(new Date());
		return fmt.toUpperCase();
	} catch {
		return "";
	}
}

export default function WgAlmanac({
	location = "",
	current,
	today,
	daily = [],
	unitLabel = "°C",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WgAlmanacProps) {
	const deg = unitLabel;
	const windUnit = deg === "°F" ? "mph" : "km/h";
	const dateline = todayLabel();

	// Inner page metrics (inside the double-rule frame).
	const FRAME = 8; // outer margin to the 2px rule
	const RULE_GAP = 8; // gap between outer 2px and inner 1px
	const innerPad = FRAME + 2 + RULE_GAP + 1; // page content inset
	const contentW = width - innerPad * 2;

	// The masthead location is set in the display face at a nominal 48px, but a
	// long city name ("London, United Kingdom") would collide with the eyebrow
	// above or overrun the page width. Scale the type down so it always fits on
	// one line. blockKie is a wide display face — ~0.62em per glyph is a safe
	// width estimate; we also clamp to keep it from going below the 15px floor.
	const locationText = location || "—";
	const MASTHEAD_MAX = 48;
	const MASTHEAD_MIN = 22;
	const headPad = 16; // matches the inner column's horizontal padding
	const headAvail = contentW - headPad * 2;
	const fitFontSize = headAvail / (locationText.length * 0.62);
	const locationFontSize = Math.max(
		MASTHEAD_MIN,
		Math.min(MASTHEAD_MAX, fitFontSize),
	);

	// ----- empty / error state — render the message centered, still framed. ---
	if (message || !current) {
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
					{/* outer 2px rule */}
					<div
						style={{
							display: "flex",
							flex: 1,
							border: "2px solid #000",
							boxSizing: "border-box",
							padding: RULE_GAP,
						}}
					>
						{/* inner 1px rule */}
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
								{message || "Weather observations unavailable."}
							</div>
						</div>
					</div>
				</div>
			</PreSatori>
		);
	}

	// Forecast table: prefer the days *after* today; fall back to all of them.
	const tableDays = (daily.length > 1 ? daily.slice(1) : daily).slice(0, 5);

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
						{/* thick rule above */}
						<div
							style={{
								display: "flex",
								height: 5,
								backgroundColor: "#000",
								marginBottom: 6,
							}}
						/>
						{/* tiny eyebrow line */}
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: 15,
								marginBottom: 8,
								...SCAPS,
							}}
						>
							THE OLD WEATHER ALMANAC
						</div>
						{/* the location, large & centered. Font scales down to fit a
						    long name on one line (see locationFontSize). */}
						<div
							className="font-blockKie"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								textAlign: "center",
								width: "100%",
								fontSize: locationFontSize,
								lineHeight: 1.1,
								whiteSpace: "nowrap",
								overflow: "hidden",
							}}
						>
							{locationText}
						</div>
						{/* hairline below */}
						<div
							style={{
								display: "flex",
								height: 1.5,
								backgroundColor: "#000",
								marginTop: 6,
							}}
						/>
						{/* dateline: today's date · WEATHER OBSERVATIONS */}
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
								<div style={{ display: "flex" }}>WEATHER OBSERVATIONS</div>
							</div>
						) : null}

						{/* ============ ornament between masthead & lead ============ */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 4 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ===================== LEAD ===================== */}
						{/* Left: the giant CURRENTLY figure.  Right: a thin column of
						    observations, divided by a vertical rule. */}
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "stretch",
							}}
						>
							{/* --- giant figure --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									paddingRight: 18,
								}}
							>
								<div
									className="font-geneva9"
									style={{ display: "flex", fontSize: 15, ...SCAPS }}
								>
									CURRENTLY
								</div>
								{/* the figure, with a sliver of hatch tone beneath the cap */}
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
											fontSize: 96,
											lineHeight: 0.92,
										}}
									>
										{current.temp}
										{deg}
									</div>
									{/* glyph for the present sky, framed in a hairline box */}
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											marginLeft: 12,
											marginTop: 6,
										}}
									>
										<div
											style={{
												display: "flex",
												border: "1.5px solid #000",
												padding: 5,
											}}
										>
											<Glyph
												kind={kindFor(current.code)}
												size={58}
												stroke={3}
											/>
										</div>
										<div
											style={{
												display: "flex",
												overflow: "hidden",
												marginTop: 3,
											}}
										>
											<Hatch w={70} h={6} step={5} />
										</div>
									</div>
								</div>
								{/* the prose verdict */}
								<div
									className="font-inter"
									style={{
										display: "flex",
										fontSize: 16,
										fontStyle: "italic",
										marginTop: 2,
									}}
								>
									“{prose(current.code, current.isDay)}.”
								</div>
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

							{/* --- observations column --- */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									paddingLeft: 18,
									justifyContent: "center",
								}}
							>
								{[
									["FEELS LIKE", `${current.feelsLike}${deg}`],
									["WIND", `${current.wind} ${windUnit}`],
									today
										? ["TODAY HI / LO", `${today.hi}${deg} / ${today.lo}${deg}`]
										: ["SKY", skyWord(current.code)],
								].map(([label, value], i) => (
									<div
										key={label}
										style={{
											display: "flex",
											flexDirection: "row",
											alignItems: "flex-end",
											justifyContent: "space-between",
											paddingTop: i === 0 ? 0 : 5,
											paddingBottom: 5,
											borderBottom: i === 2 ? "none" : "1px solid #000",
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
											style={{ display: "flex", fontSize: 22 }}
										>
											{value}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* ======= ornament between lead & forecast table ======= */}
						<div style={{ display: "flex", paddingTop: 6, paddingBottom: 5 }}>
							<OrnDivider width={contentW} />
						</div>

						{/* ================= FORECAST TABLE ================= */}
						<div
							className="font-geneva9"
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: 15,
								paddingBottom: 4,
								...SCAPS,
							}}
						>
							THE FIVE-DAY PROSPECT
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								flex: 1,
								border: "1.5px solid #000",
								boxSizing: "border-box",
							}}
						>
							{tableDays.map((d, i) => (
								<div
									key={`${d.day}-${i}`}
									style={{
										display: "flex",
										flexDirection: "column",
										flex: 1,
										alignItems: "center",
										justifyContent: "space-between",
										padding: "6px 2px 7px",
										boxSizing: "border-box",
										borderLeft: i === 0 ? "none" : "1px solid #000",
									}}
								>
									{/* day name in small caps */}
									<div
										className="font-geneva9"
										style={{ display: "flex", fontSize: 15, ...SCAPS }}
									>
										{(d.day || "—").toUpperCase()}
									</div>
									{/* engraving glyph */}
									<div style={{ display: "flex" }}>
										<Glyph kind={kindFor(d.code)} size={42} stroke={2.5} />
									</div>
									{/* terse sky word */}
									<div
										className="font-geneva9"
										style={{
											display: "flex",
											fontSize: 15,
											letterSpacing: 1,
										}}
									>
										{skyWord(d.code)}
									</div>
									{/* hi over lo, divided by a hairline */}
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
										}}
									>
										<div
											className="font-inter"
											style={{ display: "flex", fontSize: 24, lineHeight: 1 }}
										>
											{d.hi}
											{deg}
										</div>
										<div
											style={{
												display: "flex",
												width: 30,
												height: 1,
												backgroundColor: "#000",
												marginTop: 2,
												marginBottom: 2,
											}}
										/>
										<div
											className="font-inter"
											style={{ display: "flex", fontSize: 18, lineHeight: 1 }}
										>
											{d.lo}
											{deg}
										</div>
									</div>
								</div>
							))}
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
								DEGREES IN {deg === "°F" ? "FAHRENHEIT" : "CELSIUS"}
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}
