import { colorTheme, colorThemeOrder } from "@/lib/constants/color-theme";

const { teal } = colorTheme;

const chartPalette = [
  ...colorThemeOrder.map((name) => colorTheme[name].shades[600]),
  "#78716c",
  "#a8a29e",
  "#d6d3d1",
];

export const reportTheme = {
  chart: {
    period: teal.shades[600],
    periodHover: teal.shades[700],
    supplierColors: chartPalette,
    materialColors: chartPalette,
    priceLine: teal.shades[600],
  },
  kpi: {
    value: "text-teal-800",
    neutral: "text-stone-700",
    positive: "text-teal-700",
    negative: "text-clay-700",
  },
} as const;
