import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

type DailyEntry = {
	day: string;
	hi: number;
	lo: number;
	code: number;
};

interface WeatherGlanceProps {
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
// Weather icons — line-art only (strokes, no filled blobs), pure #000 on #fff.
// Each icon draws inside a `size` x `size` box; `stroke` scales with the box.
// WMO weather_code → icon family is chosen by `iconFor()`.
// ---------------------------------------------------------------------------

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

// A rounded cloud body path within a 0..100 viewBox, anchored lower so glyphs
// (rain/snow/bolt) have room beneath it.
const CLOUD_PATH =
	"M30 66 " +
	"a16 16 0 0 1 -1 -32 " +
	"a20 20 0 0 1 38 -6 " +
	"a14 14 0 0 1 5 38 " +
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
	// stroke is expressed in the 0..100 user space; convert so the *rendered*
	// stroke width stays >= the requested px regardless of `size`.
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
				<>
					<circle cx="50" cy="50" r="18" {...common} />
					{/* 8 rays */}
					<line x1="50" y1="14" x2="50" y2="26" {...common} />
					<line x1="50" y1="74" x2="50" y2="86" {...common} />
					<line x1="14" y1="50" x2="26" y2="50" {...common} />
					<line x1="74" y1="50" x2="86" y2="50" {...common} />
					<line x1="24" y1="24" x2="33" y2="33" {...common} />
					<line x1="67" y1="67" x2="76" y2="76" {...common} />
					<line x1="76" y1="24" x2="67" y2="33" {...common} />
					<line x1="33" y1="67" x2="24" y2="76" {...common} />
				</>
			)}

			{kind === "partly" && (
				<>
					{/* sun peeking top-left */}
					<circle cx="34" cy="34" r="13" {...common} />
					<line x1="34" y1="10" x2="34" y2="17" {...common} />
					<line x1="10" y1="34" x2="17" y2="34" {...common} />
					<line x1="17" y1="17" x2="22" y2="22" {...common} />
					<line x1="51" y1="17" x2="46" y2="22" {...common} />
					{/* cloud in front, shifted to lower-right */}
					<path
						d={
							"M40 78 " +
							"a14 14 0 0 1 -1 -28 " +
							"a18 18 0 0 1 34 -5 " +
							"a12 12 0 0 1 4 33 " +
							"Z"
						}
						fill="#fff"
						stroke="#000"
						strokeWidth={sw}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</>
			)}

			{kind === "cloud" && cloud}

			{kind === "fog" && (
				<>
					{cloud}
					<line x1="22" y1="78" x2="74" y2="78" {...common} />
					<line x1="30" y1="90" x2="82" y2="90" {...common} />
				</>
			)}

			{kind === "rain" && (
				<>
					{cloud}
					<line x1="34" y1="74" x2="29" y2="90" {...common} />
					<line x1="50" y1="74" x2="45" y2="90" {...common} />
					<line x1="66" y1="74" x2="61" y2="90" {...common} />
				</>
			)}

			{kind === "snow" && (
				<>
					{cloud}
					{/* simple asterisk flakes */}
					{[34, 52, 70].map((cx) => (
						<g key={cx}>
							<line x1={cx} y1="78" x2={cx} y2="92" {...common} />
							<line x1={cx - 6} y1="81" x2={cx + 6} y2="89" {...common} />
							<line x1={cx + 6} y1="81" x2={cx - 6} y2="89" {...common} />
						</g>
					))}
				</>
			)}

			{kind === "thunder" && (
				<>
					{cloud}
					<polyline points="52,72 40,90 50,90 42,100" {...common} />
				</>
			)}
		</svg>
	);
}

export default function WeatherGlance({
	location = "",
	current,
	today,
	daily = [],
	unitLabel = "°C",
	message,
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
}: WeatherGlanceProps) {
	const deg = unitLabel; // "°C" | "°F"

	// Error / empty state — render the message centered.
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
						padding: 40,
						textAlign: "center",
					}}
				>
					<div className="font-blockKie" style={{ fontSize: 30 }}>
						{message || "Weather unavailable right now."}
					</div>
				</div>
			</PreSatori>
		);
	}

	// Right-hand strip: the next ~4-5 days (skip "today" = index 0 when we can).
	const stripDays = (daily.length > 1 ? daily.slice(1) : daily).slice(0, 5);

	const heroW = Math.round(width * 0.52);

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black font-blockKie"
				style={{
					display: "flex",
					flexDirection: "row",
					width,
					height,
				}}
			>
				{/* ---------------- Hero / current ---------------- */}
				<div
					style={{
						width: heroW,
						height,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: "26px 24px 22px 30px",
						boxSizing: "border-box",
					}}
				>
					{/* Location */}
					<div
						className="font-blockKie"
						style={{
							fontSize: 28,
							lineHeight: 1.1,
							overflow: "hidden",
						}}
					>
						{location || "—"}
					</div>

					{/* Big temp + icon */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							marginTop: 4,
						}}
					>
						<div
							className="font-blockKie"
							style={{ fontSize: 96, lineHeight: 1, display: "flex" }}
						>
							{current.temp}
							{deg}
						</div>
						<div
							style={{
								display: "flex",
								marginLeft: "auto",
								alignItems: "center",
							}}
						>
							<WeatherIcon
								kind={iconFor(current.code, current.isDay)}
								size={140}
								stroke={4}
							/>
						</div>
					</div>

					{/* Feels like + wind */}
					<div
						className="font-blockKie"
						style={{ fontSize: 18, display: "flex" }}
					>
						Feels like {current.feelsLike}
						{deg} · Wind {current.wind}
						{deg === "°F" ? " mph" : " km/h"}
					</div>

					{/* Today hi / lo */}
					{today && (
						<div
							className="font-blockKie"
							style={{ fontSize: 22, display: "flex" }}
						>
							Today H {today.hi}
							{deg} · L {today.lo}
							{deg}
						</div>
					)}
				</div>

				{/* ---------------- Multi-day strip ---------------- */}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						flex: 1,
						height,
						borderLeft: "2px solid #000",
					}}
				>
					{stripDays.map((d, i) => (
						<div
							key={`${d.day}-${i}`}
							style={{
								flex: 1,
								height,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "space-between",
								padding: "30px 4px",
								boxSizing: "border-box",
								borderLeft: i === 0 ? "none" : "2px solid #000",
							}}
						>
							<div className="font-blockKie" style={{ fontSize: 20 }}>
								{d.day || "—"}
							</div>
							<div style={{ display: "flex" }}>
								<WeatherIcon kind={iconFor(d.code)} size={52} stroke={3} />
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<div className="font-blockKie" style={{ fontSize: 24 }}>
									{d.hi}
									{deg}
								</div>
								<div className="font-blockKie" style={{ fontSize: 18 }}>
									{d.lo}
									{deg}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</PreSatori>
	);
}
