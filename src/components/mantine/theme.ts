import { alpha, createTheme, type CSSVariablesResolver, type MantineTheme } from "@mantine/core";
import { semanticColorOrder, type ColorThemeName } from "@/lib/constants/color-palette";
import { mantineThemeColors } from "@/lib/constants/color-theme-mantine";

function semanticColorVars(mantineTheme: MantineTheme, name: ColorThemeName) {
  const filled = mantineTheme.colors[name][8];
  const filledHover = mantineTheme.colors[name][9];
  const outline = mantineTheme.colors[name][4];

  return {
    [`--mantine-color-${name}-filled`]: filled,
    [`--mantine-color-${name}-filled-hover`]: filledHover,
    [`--mantine-color-${name}-light`]: alpha(filled, 0.12),
    [`--mantine-color-${name}-light-hover`]: alpha(filled, 0.18),
    [`--mantine-color-${name}-light-color`]: filled,
    [`--mantine-color-${name}-outline`]: filled,
    [`--mantine-color-${name}-outline-hover`]: alpha(filled, 0.05),
    [`--mantine-color-${name}-text`]: filled,
  };
}

function semanticColorVarsDark(mantineTheme: MantineTheme, name: ColorThemeName) {
  const filled = mantineTheme.colors[name][8];
  const filledHover = mantineTheme.colors[name][9];
  const outline = mantineTheme.colors[name][4];

  return {
    [`--mantine-color-${name}-filled`]: filled,
    [`--mantine-color-${name}-filled-hover`]: filledHover,
    [`--mantine-color-${name}-light`]: alpha(filled, 0.15),
    [`--mantine-color-${name}-light-hover`]: alpha(filled, 0.2),
    [`--mantine-color-${name}-light-color`]: mantineTheme.colors[name][3],
    [`--mantine-color-${name}-outline`]: outline,
    [`--mantine-color-${name}-outline-hover`]: alpha(outline, 0.05),
    [`--mantine-color-${name}-text`]: outline,
  };
}

export const theme = createTheme({
  fontFamily: "var(--font-alexandria)",
  headings: { fontFamily: "var(--font-alexandria)" },
  defaultRadius: "md",
  primaryColor: "haze",
  colors: mantineThemeColors,
  components: {
    Badge: {
      styles: {
        root: { overflow: "visible", flexShrink: 0 },
        label: { overflow: "visible", textOverflow: "clip", whiteSpace: "nowrap" },
      },
    },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => {
  const light = semanticColorOrder.reduce(
    (acc, name) => ({ ...acc, ...semanticColorVars(mantineTheme, name) }),
    {} as Record<string, string>,
  );
  const dark = semanticColorOrder.reduce(
    (acc, name) => ({ ...acc, ...semanticColorVarsDark(mantineTheme, name) }),
    {} as Record<string, string>,
  );

  return { variables: {}, light, dark };
};
