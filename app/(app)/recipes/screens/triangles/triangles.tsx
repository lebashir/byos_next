import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import TrianglesAlmanac from "./themes/almanac";
import TrianglesBrutal from "./themes/brutal";
import TrianglesDefault from "./themes/default";
import TrianglesMac from "./themes/mac";

export const paramsSchema = z.object({
	seed: z
		.number()
		.default(7)
		.describe("Random seed; change for a new pattern")
		.meta({ title: "Seed" }),
	density: z
		.number()
		.default(5)
		.describe("Subdivision depth (3-7)")
		.meta({ title: "Density" }),
	theme: themeParam(),
});

export const dataSchema = paramsSchema;

type TrianglesParams = z.infer<typeof dataSchema>;

type TrianglesView = ComponentType<{
	params: TrianglesParams;
	width?: number;
	height?: number;
}>;

// Generative low-poly / kumiko triangle art, rendered in the look chosen by
// `params.theme`. Each view is a self-contained 1-bit composition under
// ./themes sharing the same PRNG-driven geometry, so the catalog shows one
// "Triangles" recipe.
const THEMES: Record<ThemeName, TrianglesView> = {
	default: TrianglesDefault,
	almanac: TrianglesAlmanac,
	mac: TrianglesMac,
	brutal: TrianglesBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "triangles",
		title: "Triangles",
		description: "Generative low-poly / kumiko triangle art.",
		published: true,
		tags: ["art", "generative", "svg", "geometric", "configurable", "themed"],
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
		return (
			<View width={width} height={height} params={params as TrianglesParams} />
		);
	},
};
