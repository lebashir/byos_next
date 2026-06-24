import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import NightSkyAlmanac from "./themes/almanac";
import NightSkyBrutal from "./themes/brutal";
import NightSkyDefault from "./themes/default";
import NightSkyMac from "./themes/mac";

export const paramsSchema = z.object({
	lat: z
		.number()
		.default(40.71)
		.describe("Latitude")
		.meta({ title: "Latitude" }),
	lon: z
		.number()
		.default(-74.0)
		.describe("Longitude")
		.meta({ title: "Longitude" }),
	showLines: z
		.boolean()
		.default(true)
		.describe("Draw constellation lines")
		.meta({ title: "Constellation lines" }),
	theme: themeParam(),
});

export const dataSchema = paramsSchema;

type NightSkyParams = z.infer<typeof dataSchema>;

type NightSkyView = ComponentType<{
	params: NightSkyParams;
	width?: number;
	height?: number;
}>;

// A printed-style star chart for your location and time, rendered in the look
// chosen by `params.theme`. Each view is a self-contained 1-bit composition
// under ./themes; the catalog shows one "Night Sky" recipe. This is a pure
// render — the chart is computed from params (lat/lon) plus the local time at
// render, so there is no getData.
const THEMES: Record<ThemeName, NightSkyView> = {
	default: NightSkyDefault,
	almanac: NightSkyAlmanac,
	mac: NightSkyMac,
	brutal: NightSkyBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "night-sky",
		title: "Night Sky",
		description: "Printed-style star chart for your location and time.",
		published: true,
		tags: ["art", "astronomy", "svg", "configurable", "themed"],
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
			<View params={params as NightSkyParams} width={width} height={height} />
		);
	},
};
