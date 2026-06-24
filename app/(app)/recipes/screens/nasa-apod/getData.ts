// Live data — always fetch fresh.
export const dynamic = "force-dynamic";

type ApodParams = {
	apiKey?: string;
	date?: string;
};

export interface ApodData {
	title: string;
	imageUrl: string;
	date: string;
	copyright?: string;
	explanation: string;
	message?: string;
}

const APOD_API = "https://api.nasa.gov/planetary/apod";

// Strict YYYY-MM-DD check so we never forward garbage to the API.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ApodResponse {
	title?: string;
	explanation?: string;
	url?: string;
	hdurl?: string;
	media_type?: string;
	date?: string;
	copyright?: string;
}

export default async function getData(params?: ApodParams): Promise<ApodData> {
	// Prefer an explicit (non-default) param key, else the NASA_API_KEY env var,
	// else DEMO_KEY. Lets all NASA variants use a real key with no DB/param config.
	const paramKey = params?.apiKey?.trim();
	const apiKey =
		(paramKey && paramKey !== "DEMO_KEY"
			? paramKey
			: process.env.NASA_API_KEY?.trim()) || "DEMO_KEY";
	const date = params?.date?.trim() ?? "";

	const query = new URLSearchParams({ api_key: apiKey });
	if (date && DATE_RE.test(date)) {
		query.set("date", date);
	}

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 8000);
	try {
		const res = await fetch(`${APOD_API}?${query.toString()}`, {
			signal: ctrl.signal,
		});
		if (!res.ok) {
			return {
				title: "",
				imageUrl: "",
				date: "",
				explanation: "",
				message: "NASA APOD is unavailable right now.",
			};
		}

		const json = (await res.json()) as ApodResponse;
		const title = json.title ?? "";
		const apodDate = json.date ?? "";
		const explanation = json.explanation ?? "";
		const copyright = json.copyright?.trim()
			? json.copyright.trim()
			: undefined;

		if (json.media_type !== "image") {
			return {
				title,
				imageUrl: "",
				date: apodDate,
				explanation,
				...(copyright ? { copyright } : {}),
				message: "Today's APOD is a video — open it on the web.",
			};
		}

		// Prefer the regular-resolution `url` over `hdurl`: hdurl is often
		// multi-megabyte and won't finish loading inside the renderer's short
		// network-idle window, leaving a blank (black) frame.
		const imageUrl = json.url || json.hdurl || "";
		if (!imageUrl) {
			return {
				title,
				imageUrl: "",
				date: apodDate,
				explanation,
				...(copyright ? { copyright } : {}),
				message: "NASA APOD is unavailable right now.",
			};
		}

		return {
			title,
			imageUrl,
			date: apodDate,
			explanation,
			...(copyright ? { copyright } : {}),
		};
	} catch {
		return {
			title: "",
			imageUrl: "",
			date: "",
			explanation: "",
			message: "NASA APOD is unavailable right now.",
		};
	} finally {
		clearTimeout(timer);
	}
}
