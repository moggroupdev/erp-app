import { chartNeutralColors, semanticColorOrder, semanticPalette } from "@/lib/constants/color-palette";

const { teal } = semanticPalette;

const chartPalette = [...semanticColorOrder.map((name) => semanticPalette[name][600]), ...chartNeutralColors];

export const reportTheme = {
  chart: {
    period: teal[600],
    periodHover: teal[700],
    supplierColors: chartPalette,
    materialColors: chartPalette,
    priceLine: teal[600],
  },
  kpi: {
    value: "text-teal-800",
    neutral: "text-stone-700",
    positive: "text-teal-700",
    negative: "text-clay-700",
  },
} as const;
