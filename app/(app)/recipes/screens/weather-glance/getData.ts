// Live data — always fetch fresh (no API key required; Open-Meteo).
export const dynamic = "force-dynamic";

type WeatherGlanceParams = {
	location?: string;
	units?: "metric" | "imperial" | string;
};

interface CurrentBlock {
	temp: number;
	feelsLike: number;
	code: number;
	wind: number;
	isDay: boolean;
}

interface TodayBlock {
	hi: number;
	lo: number;
}

interface DailyEntry {
	day: string;
	hi: number;
	lo: number;
	code: number;
}

export interface WeatherGlanceData {
	location: string;
	current?: CurrentBlock;
	today?: TodayBlock;
	daily: DailyEntry[];
	unitLabel: string;
	message?: string;
}

interface GeocodingResponse {
	results?: Array<{
		name: string;
		country?: string;
		latitude: number;
		longitude: number;
	}>;
}

interface OpenMeteoResponse {
	current?: {
		temperature_2m: number;
		apparent_temperature: number;
		weather_code: number;
		wind_speed_10m: number;
		is_day: number;
	};
	daily?: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
	};
}

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const FALLBACK = "Weather unavailable right now.";

function round(n: unknown): number {
	const v = typeof n === "number" ? n : Number(n);
	return Number.isFinite(v) ? Math.round(v) : 0;
}

// Short weekday (e.g. "Mon") from an ISO date string like "2026-06-23".
function shortWeekday(isoDate: string): string {
	// Parse as a local date at noon to avoid timezone edge cases shifting the day.
	const d = new Date(`${isoDate}T12:00:00`);
	if (Number.isNaN(d.getTime())) return "";
	return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
}

async function fetchJson<T>(
	url: string,
	signal: AbortSignal,
): Promise<T | null> {
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal,
			next: { revalidate: 0 },
		});
		return res.ok ? ((await res.json()) as T) : null;
	} catch {
		return null;
	}
}

export default async function getData(
	params?: WeatherGlanceParams,
): Promise<WeatherGlanceData> {
	const inputLocation =
		typeof params?.location === "string" && params.location.trim()
			? params.location.trim()
			: "London";
	const imperial =
		typeof params?.units === "string" &&
		params.units.trim().toLowerCase() === "imperial";
	const unitLabel = imperial ? "°F" : "°C";

	const fail = (): WeatherGlanceData => ({
		location: inputLocation,
		daily: [],
		unitLabel,
		message: FALLBACK,
	});

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 8000);
	try {
		// 1) Geocode the location → lat/lon + resolved name.
		const geo = await fetchJson<GeocodingResponse>(
			`${GEO_URL}?name=${encodeURIComponent(inputLocation)}&count=1&language=en&format=json`,
			ctrl.signal,
		);
		const place = geo?.results?.[0];
		if (
			!place ||
			!Number.isFinite(place.latitude) ||
			!Number.isFinite(place.longitude)
		) {
			return fail();
		}
		const resolvedName = place.country
			? `${place.name}, ${place.country}`
			: place.name;

		// 2) Fetch the forecast for those coordinates.
		const unitQs = imperial
			? "&temperature_unit=fahrenheit&wind_speed_unit=mph"
			: "";
		const forecast = await fetchJson<OpenMeteoResponse>(
			`${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
				"&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day" +
				"&daily=weather_code,temperature_2m_max,temperature_2m_min" +
				`&timezone=auto&forecast_days=5${unitQs}`,
			ctrl.signal,
		);

		if (!forecast?.current) {
			return fail();
		}

		const c = forecast.current;
		const current: CurrentBlock = {
			temp: round(c.temperature_2m),
			feelsLike: round(c.apparent_temperature),
			code: round(c.weather_code),
			wind: round(c.wind_speed_10m),
			isDay: Number(c.is_day) === 1,
		};

		const d = forecast.daily;
		const daily: DailyEntry[] = [];
		let today: TodayBlock | undefined;
		if (d && Array.isArray(d.time)) {
			for (let i = 0; i < d.time.length; i++) {
				daily.push({
					day: shortWeekday(d.time[i]),
					hi: round(d.temperature_2m_max?.[i]),
					lo: round(d.temperature_2m_min?.[i]),
					code: round(d.weather_code?.[i]),
				});
			}
			if (daily.length > 0) {
				today = { hi: daily[0].hi, lo: daily[0].lo };
			}
		}

		return {
			location: resolvedName,
			current,
			today,
			daily,
			unitLabel,
		};
	} catch {
		// NEVER throw — degrade gracefully.
		return fail();
	} finally {
		clearTimeout(timer);
	}
}
