import type { ComponentType } from "react";
import { z } from "zod";
import { resolveTheme, type ThemeName, themeParam } from "@/lib/recipes/themes";
import type { RecipeDefinition } from "@/lib/recipes/types";
import WorldClockAlmanac from "./themes/almanac";
import WorldClockBrutal from "./themes/brutal";
import WorldClockDefault from "./themes/default";
import WorldClockMac from "./themes/mac";

export const paramsSchema = z.object({
	zones: z
		.string()
		.default("America/New_York,Europe/London,Asia/Tokyo,Australia/Sydney")
		.describe("Comma-separated IANA time zones (up to 7)")
		.meta({ title: "Time zones", placeholder: "Europe/London,Asia/Tokyo" }),
	hour12: z
		.boolean()
		.default(false)
		.describe("12-hour clock")
		.meta({ title: "12-hour" }),
	theme: themeParam(),
});

export const dataSchema = paramsSchema;

type WorldClockView = ComponentType<{
	width?: number;
	height?: number;
	params?: Partial<z.infer<typeof dataSchema>>;
}>;

// A horizontal multi-timezone clock strip, rendered in the look chosen by
// `params.theme`. Each view is a self-contained 1-bit composition under
// ./themes; the time logic is computed per view from `params` so the catalog
// shows one "World Clock" recipe.
const THEMES: Record<ThemeName, WorldClockView> = {
	default: WorldClockDefault,
	almanac: WorldClockAlmanac,
	mac: WorldClockMac,
	brutal: WorldClockBrutal,
};

export const definition: RecipeDefinition<
	typeof paramsSchema,
	typeof dataSchema
> = {
	meta: {
		slug: "world-clock",
		title: "World Clock",
		description: "Horizontal multi-timezone clock strip.",
		published: true,
		tags: ["clock", "productivity", "configurable", "themed"],
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
			<View
				width={width}
				height={height}
				params={params as z.infer<typeof dataSchema>}
			/>
		);
	},
};
