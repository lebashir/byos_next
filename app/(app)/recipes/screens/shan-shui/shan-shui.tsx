import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import ShanShuiAlmanac from "./themes/almanac";
import ShanShuiBrutal from "./themes/brutal";
import ShanShuiDefault from "./themes/default";
import ShanShuiMac from "./themes/mac";

export const paramsSchema = z.object({
	seed: z
		.number()
		.default(42)
		.describe("Random seed; change for a new scene")
		.meta({ title: "Seed" }),
	layers: z
		.number()
		.default(4)
		.describe("Number of mountain ridges (2-6)")
		.meta({ title: "Mountain layers" }),
	theme: themeParam(),
});

export const dataSchema = paramsSchema;

type ShanShuiView = ComponentType<{
	width?: number;
	height?: number;
	params?: Partial<z.infer<typeof dataSchema>>;
}>;

// A generative ink-wash landscape, rendered in the look chosen by `params.theme`.
// Each view is a self-contained 1-bit composition under ./themes; the seed-driven
// PRNG scene is shared so the catalog shows one "Shan Shui" recipe.
const THEMES: Record<ThemeName, ShanShuiView> = {
	default: ShanShuiDefault,
	almanac: ShanShuiAlmanac,
	mac: ShanShuiMac,
	brutal: ShanShuiBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "shan-shui",
		title: "Shan Shui",
		description: "Generative Chinese ink-wash landscape.",
		published: true,
		tags: ["art", "generative", "svg", "configurable", "themed"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-06-22T00:00:00Z",
		updatedAt: "2026-06-24T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	Component: ({ width, height, params }) => {
		const View = THEMES[resolveTheme((params as { theme?: string }).theme)];
		return <View width={width} height={height} params={params} />;
	},
};
