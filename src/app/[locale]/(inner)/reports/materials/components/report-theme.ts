import { colorTheme } from "@/lib/constants/color-theme";

const { teal, haze, ochre, clay, plum } = colorTheme;

export const reportTheme = {
  surface: "bg-stone-50/80",
  card: "bg-white border border-stone-200/80 shadow-sm",
  accent: teal.shades[600],
  accentMuted: teal.shades[200],
  chart: {
    materialTypes: [teal.shades[600], plum.shades[600]],
    stockStatus: {
      out_of_stock: clay.shades[600],
      low_stock: ochre.shades[600],
      in_stock: teal.shades[600],
    },
    categoryBar: teal.shades[700],
    categoryBarHover: teal.shades[600],
  },
  kpi: {
    value: "text-teal-800",
    neutral: "text-stone-700",
    positive: "text-teal-700",
    negative: "text-clay-700",
    warning: "text-ochre-700",
    info: "text-haze-700",
  },
} as const;

export const reportChartSeries = [
  teal.shades[600],
  haze.shades[600],
  ochre.shades[600],
  clay.shades[600],
  plum.shades[600],
] as const;
