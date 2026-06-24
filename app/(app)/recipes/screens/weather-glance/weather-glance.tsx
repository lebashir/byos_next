import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import getWeatherGlanceData from "./getData";
import WeatherGlanceAlmanac from "./themes/almanac";
import WeatherGlanceBrutal from "./themes/brutal";
import WeatherGlanceDefault from "./themes/default";
import WeatherGlanceMac from "./themes/mac";

export const paramsSchema = z.object({
	location: z
		.string()
		.default("London")
		.describe("City name")
		.meta({ title: "Location", placeholder: "London" }),
	units: z
		.enum(["metric", "imperial"])
		.default("metric")
		.describe("Units")
		.meta({ title: "Units" }),
	theme: themeParam(),
});

export const dataSchema = z.object({
	location: z.string().default(""),
	current: z
		.object({
			temp: z.number(),
			feelsLike: z.number(),
			code: z.number(),
			wind: z.number(),
			isDay: z.boolean(),
		})
		.optional(),
	today: z
		.object({
			hi: z.number(),
			lo: z.number(),
		})
		.optional(),
	daily: z
		.array(
			z.object({
				day: z.string(),
				hi: z.number(),
				lo: z.number(),
				code: z.number(),
			}),
		)
		.default([]),
	unitLabel: z.string().default("°C"),
	message: z.string().optional(),
});

// Data is always fully populated (dataSchema applies defaults), and the Mac
// view requires the full shape — so the view type is the non-partial data.
type WeatherGlanceView = ComponentType<
	z.infer<typeof dataSchema> & { width?: number; height?: number }
>;

// At-a-glance weather, rendered in the look chosen by `params.theme`. Each
// view is a self-contained 1-bit composition under ./themes; the data and
// fetch are shared here so the catalog shows one "Weather Glance" recipe.
const THEMES: Record<ThemeName, WeatherGlanceView> = {
	default: WeatherGlanceDefault,
	almanac: WeatherGlanceAlmanac,
	mac: WeatherGlanceMac,
	brutal: WeatherGlanceBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "weather-glance",
		title: "Weather Glance",
		description:
			"Clean at-a-glance weather with a multi-day strip (Open-Meteo, no API key).",
		published: true,
		tags: ["weather", "api", "live-data", "configurable", "themed"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-06-22T00:00:00Z",
		updatedAt: "2026-06-24T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getWeatherGlanceData(params),
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
