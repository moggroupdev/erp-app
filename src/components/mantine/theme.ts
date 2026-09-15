import { alpha, createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

/** Tailwind teal-50 … teal-900 so Mantine `teal.8` matches `teal-800`. */
const teal: MantineColorsTuple = [
  "#f0fdfa",
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
];

export const theme = createTheme({
  fontFamily: "var(--font-alexandria)",
  headings: { fontFamily: "var(--font-alexandria)" },
  defaultRadius: "md",
  colors: { teal },
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
  const teal800 = mantineTheme.colors.teal[8];
  const teal900 = mantineTheme.colors.teal[9];

  return {
    variables: {},
    light: {
      "--mantine-color-teal-filled": teal800,
      "--mantine-color-teal-filled-hover": teal900,
      "--mantine-color-teal-light": alpha(teal800, 0.12),
      "--mantine-color-teal-light-hover": alpha(teal800, 0.18),
      "--mantine-color-teal-light-color": teal800,
      "--mantine-color-teal-outline": teal800,
      "--mantine-color-teal-outline-hover": alpha(teal800, 0.05),
      "--mantine-color-teal-text": teal800,
    },
    dark: {
      "--mantine-color-teal-filled": teal800,
      "--mantine-color-teal-filled-hover": teal900,
      "--mantine-color-teal-light": alpha(teal800, 0.15),
      "--mantine-color-teal-light-hover": alpha(teal800, 0.2),
      "--mantine-color-teal-light-color": mantineTheme.colors.teal[3],
      "--mantine-color-teal-outline": mantineTheme.colors.teal[4],
      "--mantine-color-teal-outline-hover": alpha(mantineTheme.colors.teal[4], 0.05),
      "--mantine-color-teal-text": mantineTheme.colors.teal[4],
    },
  };
};
