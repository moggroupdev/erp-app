import { alpha, createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

const TEAL_800 = "#115e59";
const TEAL_900 = "#134e4a";

/** Light shades are teal-800 washes; default shade 6 is teal-800. */
const teal: MantineColorsTuple = [
  "#e2eceb",
  "#d4e2e1",
  "#bcd2d1",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  TEAL_800,
  TEAL_900,
  TEAL_800,
  TEAL_900,
];

const HAZE_800 = "#2478b5";
const HAZE_900 = "#1c6296";

/** Soft blue accent; light shades are haze washes. */
const haze: MantineColorsTuple = [
  "#daf1fc",
  "#bee5f9",
  "#93d3f4",
  "#54b6e8",
  "#2f9dd6",
  "#2189c4",
  HAZE_800,
  HAZE_900,
  HAZE_800,
  HAZE_900,
];

export const theme = createTheme({
  fontFamily: "var(--font-alexandria)",
  headings: { fontFamily: "var(--font-alexandria)" },
  defaultRadius: "md",
  colors: { teal, haze },
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
  const haze800 = mantineTheme.colors.haze[8];
  const haze900 = mantineTheme.colors.haze[9];

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
      "--mantine-color-haze-filled": haze800,
      "--mantine-color-haze-filled-hover": haze900,
      "--mantine-color-haze-light": alpha(haze800, 0.12),
      "--mantine-color-haze-light-hover": alpha(haze800, 0.18),
      "--mantine-color-haze-light-color": haze800,
      "--mantine-color-haze-outline": haze800,
      "--mantine-color-haze-outline-hover": alpha(haze800, 0.05),
      "--mantine-color-haze-text": haze800,
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
      "--mantine-color-haze-filled": haze800,
      "--mantine-color-haze-filled-hover": haze900,
      "--mantine-color-haze-light": alpha(haze800, 0.15),
      "--mantine-color-haze-light-hover": alpha(haze800, 0.2),
      "--mantine-color-haze-light-color": mantineTheme.colors.haze[3],
      "--mantine-color-haze-outline": mantineTheme.colors.haze[4],
      "--mantine-color-haze-outline-hover": alpha(mantineTheme.colors.haze[4], 0.05),
      "--mantine-color-haze-text": mantineTheme.colors.haze[4],
    },
  };
};
