import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

interface WorldClockProps {
	width?: number;
	height?: number;
	params?: {
		zones?: string;
		hour12?: boolean;
	};
}

interface ZoneInfo {
	city: string;
	time: string;
	dayDate: string;
	offset: string;
	hour: number;
	valid: boolean;
}

const MAX_ZONES = 7;

// Pull a single field value out of formatToParts for a given timeZone.
const getPart = (
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
): string => parts.find((p) => p.type === type)?.value ?? "";

// "America/New_York" -> "New York"
const cityFromZone = (zone: string): string => {
	const last = zone.split("/").pop() ?? zone;
	return last.replace(/_/g, " ");
};

const buildZoneInfo = (zone: string, now: Date, hour12: boolean): ZoneInfo => {
	const blank: ZoneInfo = {
		city: cityFromZone(zone),
		time: "--:--",
		dayDate: "",
		offset: "",
		hour: -1,
		valid: false,
	};

	if (!zone) return blank;

	try {
		// Time (HH:MM, 12/24h per param).
		const timeParts = new Intl.DateTimeFormat(hour12 ? "en-US" : "en-GB", {
			timeZone: zone,
			hour: "2-digit",
			minute: "2-digit",
			hour12,
		}).formatToParts(now);

		const hourStr = getPart(timeParts, "hour");
		const minuteStr = getPart(timeParts, "minute");
		const time = `${hourStr}:${minuteStr}`;

		// 24h hour for the day/night indicator, independent of display format.
		const hour24Str =
			new Intl.DateTimeFormat("en-GB", {
				timeZone: zone,
				hour: "2-digit",
				hour12: false,
			})
				.formatToParts(now)
				.find((p) => p.type === "hour")?.value ?? "";
		const hour = Number.parseInt(hour24Str, 10);

		// Day + date, e.g. "Mon 23 Jun".
		const dateParts = new Intl.DateTimeFormat("en-GB", {
			timeZone: zone,
			weekday: "short",
			day: "2-digit",
			month: "short",
		}).formatToParts(now);
		const dayDate = `${getPart(dateParts, "weekday")} ${getPart(
			dateParts,
			"day",
		)} ${getPart(dateParts, "month")}`;

		// UTC offset, e.g. "GMT+1".
		const tzParts = new Intl.DateTimeFormat("en-GB", {
			timeZone: zone,
			timeZoneName: "shortOffset",
			hour: "2-digit",
		}).formatToParts(now);
		let offset = getPart(tzParts, "timeZoneName");
		if (!offset) {
			const longParts = new Intl.DateTimeFormat("en-GB", {
				timeZone: zone,
				timeZoneName: "short",
				hour: "2-digit",
			}).formatToParts(now);
			offset = getPart(longParts, "timeZoneName");
		}
		// Normalize "UTC+1" / "GMT+01:00" presentations to a compact "GMT±H".
		offset = offset.replace(/^UTC/, "GMT");

		return {
			city: cityFromZone(zone),
			time,
			dayDate,
			offset,
			hour: Number.isNaN(hour) ? -1 : hour,
			valid: true,
		};
	} catch {
		// Invalid / unknown zone string -> blank column rather than throwing.
		return blank;
	}
};

// Simple 1-bit sun: outlined circle + straight rays. All #000, strokes >= 2px.
const SunIcon = ({ size }: { size: number }) => {
	const c = size / 2;
	const r = size * 0.22;
	const inner = r + size * 0.06;
	const outer = size * 0.46;
	const rays = [0, 45, 90, 135, 180, 225, 270, 315];
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Day</title>
			<circle cx={c} cy={c} r={r} fill="none" stroke="#000" strokeWidth={2} />
			{rays.map((deg) => {
				const a = (deg * Math.PI) / 180;
				return (
					<line
						key={deg}
						x1={c + Math.cos(a) * inner}
						y1={c + Math.sin(a) * inner}
						x2={c + Math.cos(a) * outer}
						y2={c + Math.sin(a) * outer}
						stroke="#000"
						strokeWidth={2}
					/>
				);
			})}
		</svg>
	);
};

// Simple 1-bit crescent moon: outline only via two arcs forming a sliver.
const MoonIcon = ({ size }: { size: number }) => {
	const c = size / 2;
	const r = size * 0.36;
	const off = size * 0.18;
	// Outer arc (full curve) then inner arc (the bite) sharing endpoints.
	const topX = c;
	const topY = c - r;
	const botX = c;
	const botY = c + r;
	const d = [
		`M ${topX} ${topY}`,
		`A ${r} ${r} 0 1 0 ${botX} ${botY}`,
		`A ${r * 0.95} ${r * 0.95} 0 1 1 ${topX} ${topY}`,
		"Z",
	].join(" ");
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Night</title>
			<path
				d={d}
				fill="none"
				stroke="#000"
				strokeWidth={2}
				transform={`translate(${off} 0)`}
			/>
		</svg>
	);
};

export default function WorldClock({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: WorldClockProps) {
	const rawZones = params?.zones ?? "";
	const hour12 = params?.hour12 ?? false;

	const zones = rawZones
		.split(",")
		.map((z) => z.trim())
		.filter((z) => z.length > 0)
		.slice(0, MAX_ZONES);

	const now = new Date();
	const columns = (zones.length > 0 ? zones : [""]).map((zone) =>
		buildZoneInfo(zone, now, hour12),
	);

	const count = columns.length;
	// Scale the hero time down a touch as columns get crowded.
	const timeSize = count <= 3 ? 60 : count <= 5 ? 52 : 44;
	const iconSize = 28;

	return (
		<PreSatori width={width} height={height}>
			<div
				className="bg-white text-black"
				style={{
					display: "flex",
					flexDirection: "row",
					width,
					height,
					backgroundColor: "#fff",
					color: "#000",
				}}
			>
				{columns.map((col, idx) => (
					<div
						key={`${col.city}-${idx}`}
						style={{
							display: "flex",
							flexDirection: "row",
							flex: 1,
							height,
							// 2px black divider between columns (not after the last).
							borderRight:
								idx < count - 1 ? "2px solid #000" : "0px solid #000",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								height,
								alignItems: "center",
								justifyContent: "space-between",
								padding: "18px 8px",
								overflow: "hidden",
							}}
						>
							{/* Top: day/night icon + city name */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										height: iconSize,
									}}
								>
									{col.valid ? (
										col.hour >= 6 && col.hour < 18 ? (
											<SunIcon size={iconSize} />
										) : (
											<MoonIcon size={iconSize} />
										)
									) : null}
								</div>
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										fontSize: 20,
										marginTop: 8,
										textAlign: "center",
										lineHeight: 1.1,
									}}
								>
									{col.city}
								</div>
							</div>

							{/* Hero: big time */}
							<div
								className="font-blockKie"
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: timeSize,
									fontWeight: 700,
									lineHeight: 1,
									textAlign: "center",
								}}
							>
								{col.time}
							</div>

							{/* Bottom: date + offset */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										fontSize: 18,
										textAlign: "center",
										lineHeight: 1.2,
									}}
								>
									{col.dayDate}
								</div>
								<div
									className="font-blockKie"
									style={{
										display: "flex",
										fontSize: 16,
										marginTop: 4,
										textAlign: "center",
									}}
								>
									{col.offset}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</PreSatori>
	);
}
