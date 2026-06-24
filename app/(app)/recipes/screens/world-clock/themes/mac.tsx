import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { PreSatori } from "@/utils/pre-satori";

// ===========================================================================
// World Clock (Mac) — the multi-timezone strip restyled as a 1984 Macintosh
// System "Control Panel": one chrome window on the dithered desktop, each
// zone presented as a framed "well" (city, big time, day/date, sun/moon).
// Pure #000 / #fff. Flexbox + inline SVG only (Takumi-safe — no grid, filter,
// gradient, shadow, opacity). SVG children are wrapped in <g>, never <>.
// ===========================================================================

const MAX_ZONES = 7;

interface ZoneInfo {
	city: string;
	time: string;
	dayDate: string;
	offset: string;
	hour: number;
	valid: boolean;
}

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

// Per-zone time logic — mirrors the source world-clock screen exactly.
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
		return blank;
	}
};

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

// Chunky MacPaint-style sun: triangular sunburst rays around a filled disc.
const SunIcon = ({ size }: { size: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>Day</title>
		<g>
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
					/>
				);
			})}
			<circle
				cx="50"
				cy="50"
				r="20"
				fill="#fff"
				stroke="#000"
				strokeWidth={7}
			/>
		</g>
	</svg>
);

// Chunky 1-bit crescent moon: filled black disc with a white bite removed.
const MoonIcon = ({ size }: { size: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>Night</title>
		<g>
			<circle
				cx="50"
				cy="50"
				r="34"
				fill="#000"
				stroke="#000"
				strokeWidth={4}
			/>
			<circle cx="64" cy="42" r="28" fill="#fff" />
		</g>
	</svg>
);

interface WorldClockMacProps {
	width?: number;
	height?: number;
	params?: {
		zones?: string;
		hour12?: boolean;
	};
}

function WorldClockMac({
	width = DEFAULT_IMAGE_WIDTH,
	height = DEFAULT_IMAGE_HEIGHT,
	params,
}: WorldClockMacProps) {
	const rawZones = params?.zones ?? "";
	const hour12 = params?.hour12 ?? false;

	const zones = rawZones
		.split(",")
		.map((z) => z.trim())
		.filter((z) => z.length > 0)
		.slice(0, MAX_ZONES);

	const now = new Date();
	const cells = (zones.length > 0 ? zones : [""]).map((zone) =>
		buildZoneInfo(zone, now, hour12),
	);

	const count = cells.length;
	// Auto-size the hero time down as cells get crowded.
	const timeSize = count <= 2 ? 46 : count <= 4 ? 38 : count <= 6 ? 30 : 26;
	const citySize = count <= 4 ? 17 : 15;
	const iconSize = count <= 4 ? 30 : 24;

	// --- Desktop geometry: window floats on the dithered desktop with a hard
	// 2px black drop shadow on the right + bottom. ---
	const SHADOW = 2;
	const MARGIN = 10;
	const winW = width - MARGIN * 2 - SHADOW;
	const winH = height - MARGIN * 2 - SHADOW;
	const TITLE_H = 22;

	// Lay the cells out in a single row (each is a Control-Panel-style well).
	// Up to 7 zones fit comfortably across the 800px window.
	return (
		<PreSatori width={width} height={height}>
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
							id="wcDeskDither"
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
						fill="url(#wcDeskDither)"
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
								width={Math.max(10, Math.floor(winW * 0.3))}
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
							World Clock
						</div>
						<div style={{ display: "flex", flex: 1, height: TITLE_H }}>
							<DragStripes
								width={Math.max(10, Math.floor(winW * 0.3))}
								height={TITLE_H}
							/>
						</div>
						<div style={{ width: 14 + 6, display: "flex" }} />
					</div>

					{/* Window content: a row of framed zone "wells". */}
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							flex: 1,
							padding: 10,
							boxSizing: "border-box",
							backgroundColor: "#fff",
						}}
					>
						{cells.map((col, idx) => (
							<div
								key={`${col.city}-${idx}`}
								style={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									marginLeft: idx === 0 ? 0 : 8,
									border: "2px solid #000",
									backgroundColor: "#fff",
									boxSizing: "border-box",
								}}
							>
								{/* Mini title bar with the city name. */}
								<div
									style={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										height: 18,
										borderBottom: "2px solid #000",
										position: "relative",
										overflow: "hidden",
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
										<DragStripes width={12} height={18} />
									</div>
									<div
										className="font-geneva9"
										style={{
											display: "flex",
											fontSize: citySize,
											backgroundColor: "#fff",
											padding: "0 5px",
											lineHeight: 1,
											textAlign: "center",
										}}
									>
										{col.city || "—"}
									</div>
									<div
										style={{
											display: "flex",
											position: "absolute",
											top: 0,
											right: 2,
										}}
									>
										<DragStripes width={12} height={18} />
									</div>
								</div>

								{/* Well body: day/night icon, big time, date, offset. */}
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										flex: 1,
										alignItems: "center",
										justifyContent: "space-between",
										padding: "10px 4px",
										overflow: "hidden",
									}}
								>
									{/* Sun / moon. */}
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

									{/* Hero: big time in the chunky pixel face. */}
									<div
										className="font-blockKie"
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: timeSize,
											lineHeight: 1,
											textAlign: "center",
										}}
									>
										{col.time}
									</div>

									{/* Date + offset in geneva UI text. */}
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
										}}
									>
										<div
											className="font-geneva9"
											style={{
												display: "flex",
												fontSize: 15,
												textAlign: "center",
												lineHeight: 1.2,
											}}
										>
											{col.dayDate}
										</div>
										<div
											className="font-geneva9"
											style={{
												display: "flex",
												fontSize: 15,
												marginTop: 3,
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
				</div>
			</div>
		</PreSatori>
	);
}

export default WorldClockMac;
