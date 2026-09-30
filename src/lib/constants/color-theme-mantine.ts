import type { MantineColorsTuple } from "@mantine/core";
import { colorTheme, type ColorThemeName } from "@/lib/constants/color-theme";

/** Mantine tuple indices 3–5: brighter mids for gradients and dark-mode text. */
const mantineMidRamp: Record<ColorThemeName, [string, string, string]> = {
  teal: ["#5eead4", "#2dd4bf", "#14b8a6"],
  haze: ["#54b6e8", "#2f9dd6", "#2189c4"],
  ochre: ["#d4a84a", "#b8872e", "#a87620"],
  clay: ["#c97a76", "#b8635f", "#a85552"],
  plum: ["#9a85a3", "#856f8f", "#6f5a78"],
};

export function toMantineColorsTuple(name: ColorThemeName): MantineColorsTuple {
  const { shades } = colorTheme[name];
  const [mid3, mid4, mid5] = mantineMidRamp[name];

  return [
    shades[50],
    shades[100],
    shades[200],
    mid3,
    mid4,
    mid5,
    shades[600],
    shades[700],
    shades[600],
    shades[700],
  ];
}

export const mantineThemeColors = Object.fromEntries(
  (["teal", "haze", "ochre", "clay", "plum"] as const).map((name) => [name, toMantineColorsTuple(name)]),
) as Record<ColorThemeName, MantineColorsTuple>;
