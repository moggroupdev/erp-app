import { chartNeutralColors, semanticColorOrder, semanticPalette } from "@/lib/constants/color-palette";

const { haze } = semanticPalette;

const chartPalette = [...semanticColorOrder.map((name) => semanticPalette[name][600]), ...chartNeutralColors];

export const reportTheme = {
  chart: {
    period: haze[600],
    periodHover: haze[700],
    supplierColors: chartPalette,
    materialColors: chartPalette,
    priceLine: haze[600],
  },
  kpi: {
    value: "text-haze-800",
    neutral: "text-stone-700",
    positive: "text-teal-700",
    negative: "text-clay-700",
  },
} as const;
