import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import getApodData from "./getData";
import NasaApodAlmanac from "./themes/almanac";
import NasaApodBrutal from "./themes/brutal";
import NasaApodDefault from "./themes/default";
import NasaApodMac from "./themes/mac";

export const paramsSchema = z.object({
	apiKey: z
		.string()
		.default("DEMO_KEY")
		.describe("NASA API key (DEMO_KEY works, rate-limited)")
		.meta({ title: "NASA API key" }),
	date: z
		.string()
		.default("")
		.describe("YYYY-MM-DD (blank = today)")
		.meta({ title: "Date", placeholder: "2026-06-22" }),
	theme: themeParam(),
});

export const dataSchema = z.object({
	title: z.string().default(""),
	imageUrl: z.string().default(""),
	date: z.string().default(""),
	copyright: z.string().optional(),
	explanation: z.string().default(""),
	message: z.string().optional(),
});

type NasaApodView = ComponentType<
	Partial<z.infer<typeof dataSchema>> & { width?: number; height?: number }
>;

// The NASA Astronomy Picture of the Day, rendered in the look chosen by
// `params.theme`. Each view is a self-contained 1-bit composition under
// ./themes; the data and fetch are shared here so the catalog shows one
// "NASA APOD" recipe.
const THEMES: Record<ThemeName, NasaApodView> = {
	default: NasaApodDefault,
	almanac: NasaApodAlmanac,
	mac: NasaApodMac,
	brutal: NasaApodBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "nasa-apod",
		title: "NASA APOD",
		description: "NASA Astronomy Picture of the Day.",
		published: true,
		tags: ["space", "image", "api", "live-data", "themed"],
		author: { name: "byos", github: "byos" },
		category: "display-components",
		version: "0.2.0",
		createdAt: "2026-06-22T00:00:00Z",
		updatedAt: "2026-06-24T00:00:00Z",
		renderSettings: { supersample: true },
	},
	paramsSchema,
	dataSchema,
	getData: async (params) => getApodData(params),
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
