import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import getWtpData from "./getData";
import WhosThatPokemonAlmanac from "./themes/almanac";
import WhosThatPokemonBrutal from "./themes/brutal";
import WhosThatPokemonDefault from "./themes/default";
import WhosThatPokemonMac from "./themes/mac";

export const paramsSchema = z.object({
	pokemon: z
		.string()
		.default("random")
		.describe('Name or number, or "random"')
		.meta({ title: "Pokémon", placeholder: "random" }),
	reveal: z
		.boolean()
		.default(true)
		.describe("Reveal the answer at the bottom")
		.meta({ title: "Reveal answer" }),
	theme: themeParam(),
});

export const dataSchema = z.object({
	name: z.string().default(""),
	number: z.string().default(""),
	spriteUrl: z.string().default(""),
	reveal: z.boolean().default(true),
	message: z.string().optional(),
});

type WhosThatPokemonView = ComponentType<
	Partial<z.infer<typeof dataSchema>> & { width?: number; height?: number }
>;

// The silhouette guessing game, rendered in the look chosen by `params.theme`.
// Each view is a self-contained 1-bit composition under ./themes; the data and
// fetch are shared here so the catalog shows one "Who's That Pokémon?" recipe.
const THEMES: Record<ThemeName, WhosThatPokemonView> = {
	default: WhosThatPokemonDefault,
	almanac: WhosThatPokemonAlmanac,
	mac: WhosThatPokemonMac,
	brutal: WhosThatPokemonBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "whos-that-pokemon",
		title: "Who's That Pokémon?",
		description: "The classic silhouette guessing game (PokéAPI, no key).",
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
	getData: async (params) => getWtpData(params),
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
