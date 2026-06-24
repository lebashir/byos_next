import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import getF1Data, { type F1Data } from "./getData";
import F1Almanac from "./themes/almanac";
import F1Brutal from "./themes/brutal";
import F1Default from "./themes/default";
import F1Mac from "./themes/mac";

export const paramsSchema = z.object({
	season: z
		.string()
		.default("current")
		.describe('Season ("current" or a year)')
		.meta({ title: "Season" }),
	theme: themeParam(),
});

export const dataSchema = z.object({
	raceName: z.string().default(""),
	round: z.string().default(""),
	circuitName: z.string().default(""),
	circuitId: z.string().default(""),
	country: z.string().default(""),
	locality: z.string().default(""),
	dateISO: z.string().default(""),
	message: z.string().optional(),
});

type F1View = ComponentType<
	Partial<F1Data> & { width?: number; height?: number }
>;

// The next Grand Prix, rendered in the look chosen by `params.theme`. Each
// view is a self-contained 1-bit composition under ./themes; the data and
// fetch are shared here so the catalog shows one "F1 Next Race" recipe.
const THEMES: Record<ThemeName, F1View> = {
	default: F1Default,
	almanac: F1Almanac,
	mac: F1Mac,
	brutal: F1Brutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "f1",
		title: "F1 Next Race",
		description:
			"Next Formula 1 Grand Prix with circuit outline and countdown.",
		published: true,
		tags: ["sports", "f1", "api", "live-data", "svg", "themed"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-06-22T00:00:00Z",
		updatedAt: "2026-06-24T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getF1Data(params),
	Component: ({ width, height, params, data }) => {
		const View = THEMES[resolveTheme((params as { theme?: string }).theme)];
		return <View {...(data as F1Data)} width={width} height={height} />;
	},
};
