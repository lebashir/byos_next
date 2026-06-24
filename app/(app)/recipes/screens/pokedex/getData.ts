// Live data — always fetch fresh.
export const dynamic = "force-dynamic";

type PokedexParams = {
	pokemon?: string;
};

export interface PokedexData {
	id: number;
	name: string;
	number: string;
	genus: string;
	types: string[];
	heightM: number;
	weightKg: number;
	stats: { label: string; value: number }[];
	spriteUrl: string;
	flavor: string;
	message?: string;
}

const API = "https://pokeapi.co/api/v2";

const STAT_LABELS: Record<string, string> = {
	hp: "HP",
	attack: "ATK",
	defense: "DEF",
	"special-attack": "SP.ATK",
	"special-defense": "SP.DEF",
	speed: "SPD",
};
const STAT_ORDER = [
	"hp",
	"attack",
	"defense",
	"special-attack",
	"special-defense",
	"speed",
];

interface PokemonResponse {
	id: number;
	name: string;
	height: number; // decimetres
	weight: number; // hectograms
	types: { type: { name: string } }[];
	stats: { base_stat: number; stat: { name: string } }[];
	species?: { url?: string };
	sprites: {
		front_default: string | null;
		other?: {
			"official-artwork"?: { front_default: string | null };
		};
	};
}

interface SpeciesResponse {
	flavor_text_entries: {
		flavor_text: string;
		language: { name: string };
	}[];
	genera: {
		genus: string;
		language: { name: string };
	}[];
}

const EMPTY: PokedexData = {
	id: 0,
	name: "",
	number: "",
	genus: "",
	types: [],
	heightM: 0,
	weightKg: 0,
	stats: [],
	spriteUrl: "",
	flavor: "",
};

function unavailable(): PokedexData {
	return { ...EMPTY, message: "Pokédex unavailable right now." };
}

async function fetchJson<T>(
	url: string,
	signal: AbortSignal,
): Promise<T | null> {
	try {
		const res = await fetch(url, { signal });
		return res.ok ? ((await res.json()) as T) : null;
	} catch {
		return null;
	}
}

// "raichu-alola" -> "Raichu Alola"; "pikachu" -> "Pikachu".
function capitalize(name: string): string {
	return name
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

// Strip newlines/form-feeds/control chars, collapse runs of whitespace.
function cleanFlavor(text: string): string {
	// Replace control chars (code < 32) without a control-char regex literal.
	const withoutControls = Array.from(text, (ch) =>
		ch.charCodeAt(0) < 32 ? " " : ch,
	).join("");
	return withoutControls.replace(/\s+/g, " ").trim();
}

function speciesIdFrom(p: PokemonResponse): number {
	const url = p.species?.url;
	if (url) {
		const m = url.match(/\/pokemon-species\/(\d+)\/?$/);
		if (m) {
			const n = Number(m[1]);
			if (Number.isFinite(n) && n > 0) return n;
		}
	}
	return p.id;
}

export default async function getData(
	params?: PokedexParams,
): Promise<PokedexData> {
	const raw = (params?.pokemon ?? "").trim();
	const target =
		raw === "" || raw.toLowerCase() === "random"
			? String(Math.floor(Math.random() * 1025) + 1)
			: raw.toLowerCase();

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 8000);
	try {
		const mon = await fetchJson<PokemonResponse>(
			`${API}/pokemon/${target}`,
			ctrl.signal,
		);
		if (!mon || typeof mon.id !== "number") {
			return unavailable();
		}

		const speciesId = speciesIdFrom(mon);
		const species = await fetchJson<SpeciesResponse>(
			`${API}/pokemon-species/${speciesId}`,
			ctrl.signal,
		);

		let genus = "";
		let flavor = "";
		if (species) {
			const enGenus = species.genera?.find(
				(g) => g.language?.name === "en",
			)?.genus;
			genus = enGenus ?? "";
			const enFlavor = species.flavor_text_entries?.find(
				(e) => e.language?.name === "en",
			)?.flavor_text;
			flavor = enFlavor ? cleanFlavor(enFlavor) : "";
		}

		const statByName = new Map(
			(mon.stats ?? []).map((s) => [s.stat?.name, s.base_stat]),
		);
		const stats = STAT_ORDER.map((key) => ({
			label: STAT_LABELS[key],
			value: statByName.get(key) ?? 0,
		}));

		const spriteUrl =
			mon.sprites?.front_default ||
			mon.sprites?.other?.["official-artwork"]?.front_default ||
			"";

		return {
			id: mon.id,
			name: capitalize(mon.name ?? ""),
			number: `#${String(mon.id).padStart(4, "0")}`,
			genus,
			types: (mon.types ?? []).map((t) => t.type?.name).filter(Boolean),
			heightM: (mon.height ?? 0) / 10,
			weightKg: (mon.weight ?? 0) / 10,
			stats,
			spriteUrl,
			flavor,
		};
	} catch {
		return unavailable();
	} finally {
		clearTimeout(timer);
	}
}
