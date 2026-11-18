import { semanticColorOrder, semanticPalette } from "@/lib/constants/color-palette";

const { haze, teal, ochre, clay } = semanticPalette;

export const reportTheme = {
  chart: {
    permits: haze[600],
    cancelled: clay[600],
    items: teal[600],
  },
  kpi: {
    value: "text-haze-800",
    neutral: "text-gray-700",
    positive: "text-teal-700",
    negative: "text-clay-700",
    warning: "text-ochre-700",
    info: "text-haze-700",
  },
  ochre: ochre[600],
} as const;

export const reportChartSeries = semanticColorOrder.map((name) => semanticPalette[name][600]);
