import { z } from "zod";

/**
 * Shared visual-theme vocabulary for built-in recipes.
 *
 * A screen used to ship one recipe per look (`f1`, `f1-almanac`, `f1-mac`,
 * `f1-brutal`). Those are collapsed into a single recipe with a `theme`
 * parameter; the recipe's `Component` picks the view from `params.theme`.
 */
export const THEME_VALUES = ["default", "almanac", "mac", "brutal"] as const;

export type ThemeName = (typeof THEME_VALUES)[number];

/** Human labels for the theme dropdown, keyed by enum value. */
export const THEME_LABELS: Record<ThemeName, string> = {
	default: "Default",
	almanac: "Almanac",
	mac: "Macintosh",
	brutal: "Brutalist",
};

/**
 * Build the `theme` field for a recipe's `paramsSchema`. A factory (not a
 * shared instance) so each recipe owns its own schema node and metadata.
 */
export function themeParam() {
	return z.enum(THEME_VALUES).default("default").meta({
		title: "Theme",
		description: "Visual theme",
		options: THEME_LABELS,
	});
}

/** Narrow an unknown params value to a known theme, falling back to default. */
export function resolveTheme(value: unknown): ThemeName {
	return THEME_VALUES.includes(value as ThemeName)
		? (value as ThemeName)
		: "default";
}
