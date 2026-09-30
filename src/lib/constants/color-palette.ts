import paletteJson from "@/lib/constants/color-palette.json";

export type ColorThemeName = keyof typeof paletteJson.semantic;

export const semanticColorOrder = Object.keys(paletteJson.semantic) as ColorThemeName[];

export const brandColors = paletteJson.brand;

export type SemanticShadeKey = 50 | 100 | 200 | 600 | 700;

export type SemanticShades = Record<SemanticShadeKey, string>;

type SemanticShadesJson = Record<"50" | "100" | "200" | "600" | "700", string>;

function parseShades(raw: SemanticShadesJson): SemanticShades {
  return {
    50: raw["50"],
    100: raw["100"],
    200: raw["200"],
    600: raw["600"],
    700: raw["700"],
  };
}

export const semanticPalette = Object.fromEntries(
  Object.entries(paletteJson.semantic).map(([name, shades]) => [name, parseShades(shades as SemanticShadesJson)]),
) as Record<ColorThemeName, SemanticShades>;

export const mantineMidRamp = paletteJson.mantineMidRamp as Record<ColorThemeName, [string, string, string]>;

export const chartNeutralColors = paletteJson.chartNeutralColors as readonly string[];

/** Tailwind utility class tokens for a semantic color (hex lives only in color-palette.json). */
export function semanticTw(
  prefix: "text" | "bg" | "border" | "ring",
  name: ColorThemeName,
  shade: SemanticShadeKey | "800" | "900" | "500",
) {
  return `${prefix}-${name}-${shade}`;
}

/** Builds Tailwind v4 @theme custom properties from the JSON palette. */
export function buildTailwindThemeVariables(): Record<string, string> {
  const vars: Record<string, string> = {
    "--color-navy": brandColors.navy,
    "--color-navy-wash": brandColors.navyWash.toLowerCase(),
  };

  for (const name of semanticColorOrder) {
    const shades = semanticPalette[name];
    vars[`--color-${name}-50`] = shades[50];
    vars[`--color-${name}-100`] = shades[100];
    vars[`--color-${name}-200`] = shades[200];
    vars[`--color-${name}-600`] = shades[600];
    vars[`--color-${name}-700`] = shades[700];
    vars[`--color-${name}-800`] = shades[600];
    vars[`--color-${name}-900`] = shades[700];
  }

  vars["--color-clay-500"] = semanticPalette.clay[600];

  return vars;
}

/** Tailwind tokens are injected into globals.css by `npm run generate:theme`. */
export function renderTailwindThemeVariableLines(): string[] {
  return Object.entries(buildTailwindThemeVariables()).map(([key, value]) => `  ${key}: ${value};`);
}

/** Sidebar navigation chrome (references Tailwind tokens, not raw hex). */
export const sidebarNavTheme = {
  color: "haze" as const satisfies ColorThemeName,
  parentActive: "bg-haze-800 text-white",
  itemActive: "bg-haze-50 text-haze-800",
} as const;
