import type { MantineColorsTuple } from "@mantine/core";
import { mantineMidRamp, semanticColorOrder, semanticPalette, type ColorThemeName } from "@/lib/constants/color-palette";

export function toMantineColorsTuple(name: ColorThemeName): MantineColorsTuple {
  const shades = semanticPalette[name];
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
  semanticColorOrder.map((name) => [name, toMantineColorsTuple(name)]),
) as Record<ColorThemeName, MantineColorsTuple>;
