import type { ColorThemeName } from "@/lib/constants/color-palette";

type ExtendedColors = Record<ColorThemeName, readonly string[]>;

declare module "@mantine/core" {
  export interface MantineThemeColorsOverride {
    colors: ExtendedColors;
  }
}

export {};
