import sharp from "sharp";

// Live data — always fetch fresh.
export const dynamic = "force-dynamic";

type WtpParams = {
	pokemon?: string;
	reveal?: boolean;
};

export interface WtpData {
	name: string;
	number: string;
	spriteUrl: string;
	reveal: boolean;
	message?: string;
}

interface PokeApiResponse {
	id: number;
	name: string;
	sprites: {
		front_default: string | null;
		other?: {
			"official-artwork"?: {
				front_default: string | null;
			};
		};
	};
}

const POKE_API = "https://pokeapi.co/api/v2/pokemon";

// Title-case a PokéAPI slug and turn hyphens into spaces (e.g. "mr-mime" → "Mr Mime").
function prettifyName(raw: string): string {
	return raw
		.split("-")
		.map((part) =>
			part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
		)
		.join(" ");
}

// Turn a transparent sprite PNG into a pure-black silhouette server-side, so the
// screen doesn't depend on a CSS `filter` (which the takumi/satori renderers
// ignore). Returns a data URL; falls back to the original sprite on any failure.
async function toSilhouette(url: string, signal: AbortSignal): Promise<string> {
	try {
		const res = await fetch(url, { signal });
		if (!res.ok) return url;
		const buf = Buffer.from(await res.arrayBuffer());
		const meta = await sharp(buf).metadata();
		const w = meta.width ?? 96;
		const h = meta.height ?? 96;
		// Use the sprite's own alpha channel as a mask over a solid-black canvas.
		const alpha = await sharp(buf)
			.ensureAlpha()
			.extractChannel(3)
			.raw()
			.toBuffer();
		const masked = await sharp({
			create: {
				width: w,
				height: h,
				channels: 3,
				background: { r: 0, g: 0, b: 0 },
			},
		})
			.joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
			.png()
			.toBuffer();
		// Trim the transparent margin so small-sprite Pokémon still fill the
		// frame, then upscale crisply (nearest-neighbour keeps the retro edges).
		const png = await sharp(masked)
			.trim()
			.resize(280, 280, {
				fit: "contain",
				kernel: "nearest",
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.png()
			.toBuffer();
		return `data:image/png;base64,${png.toString("base64")}`;
	} catch {
		return url;
	}
}

export default async function getData(params?: WtpParams): Promise<WtpData> {
	const reveal = params?.reveal !== false;

	const defaults: WtpData = {
		name: "",
		number: "",
		spriteUrl: "",
		reveal,
		message: "Couldn't reach the Pokédex.",
	};

	// Resolve the target: empty or "random" (case-insensitive) → a random Pokémon.
	const raw = params?.pokemon?.trim() ?? "";
	const target =
		raw === "" || raw.toLowerCase() === "random"
			? String(Math.floor(Math.random() * 1025) + 1)
			: raw.toLowerCase();

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 8000);
	try {
		const res = await fetch(`${POKE_API}/${encodeURIComponent(target)}`, {
			signal: ctrl.signal,
		});
		if (!res.ok) return defaults;

		const data = (await res.json()) as PokeApiResponse;
		if (!data || typeof data.id !== "number" || !data.name) return defaults;

		const rawSprite =
			data.sprites?.front_default ||
			data.sprites?.other?.["official-artwork"]?.front_default ||
			"";
		const spriteUrl = rawSprite
			? await toSilhouette(rawSprite, ctrl.signal)
			: "";

		return {
			name: prettifyName(data.name),
			number: `#${String(data.id).padStart(4, "0")}`,
			spriteUrl,
			reveal,
		};
	} catch {
		return defaults;
	} finally {
		clearTimeout(timer);
	}
}
