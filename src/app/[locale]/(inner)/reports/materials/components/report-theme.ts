import { semanticColorOrder, semanticPalette } from "@/lib/constants/color-palette";

const { teal, haze, ochre, clay, plum } = semanticPalette;

export const reportTheme = {
  surface: "bg-stone-50/80",
  card: "bg-white border border-stone-200/80 shadow-sm",
  accent: teal[600],
  accentMuted: teal[200],
  chart: {
    materialTypes: [teal[600], plum[600]],
    stockStatus: {
      out_of_stock: clay[600],
      low_stock: ochre[600],
      in_stock: teal[600],
    },
    categoryBar: teal[700],
    categoryBarHover: teal[600],
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

export const reportChartSeries = semanticColorOrder.map((name) => semanticPalette[name][600]);
