import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import getPokedexData from "./getData";
import PokedexAlmanac from "./themes/almanac";
import PokedexBrutal from "./themes/brutal";
import PokedexDefault from "./themes/default";
import PokedexMac from "./themes/mac";

export const paramsSchema = z.object({
	pokemon: z
		.string()
		.default("random")
		.describe('Name or number, or "random"')
		.meta({ title: "Pokémon", placeholder: "pikachu / 25 / random" }),
	theme: themeParam(),
});

export const dataSchema = z.object({
	id: z.number().default(0),
	name: z.string().default(""),
	number: z.string().default(""),
	genus: z.string().default(""),
	types: z.array(z.string()).default([]),
	heightM: z.number().default(0),
	weightKg: z.number().default(0),
	stats: z
		.array(z.object({ label: z.string(), value: z.number() }))
		.default([]),
	spriteUrl: z.string().default(""),
	flavor: z.string().default(""),
	message: z.string().optional(),
});

type PokedexView = ComponentType<
	Partial<z.infer<typeof dataSchema>> & { width?: number; height?: number }
>;

// A Pokédex entry, rendered in the look chosen by `params.theme`. Each view is
// a self-contained 1-bit composition under ./themes; the data and fetch are
// shared here so the catalog shows one "Pokédex" recipe.
const THEMES: Record<ThemeName, PokedexView> = {
	default: PokedexDefault,
	almanac: PokedexAlmanac,
	mac: PokedexMac,
	brutal: PokedexBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "pokedex",
		title: "Pokédex",
		description:
			"A Pokédex entry with sprite, types, stats and flavor text (PokéAPI, no key).",
		published: true,
		tags: ["pokemon", "game", "api", "live-data", "image", "themed"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-06-23T00:00:00Z",
		updatedAt: "2026-06-24T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getPokedexData(params),
	Component: ({ width, height, params, data }) => {
		const View = THEMES[resolveTheme((params as { theme?: string }).theme)];
		return (
			<View
				{...(data as z.infer<typeof dataSchema>)}
				width={width}
				height={height}
			/>
		);
	},
};
