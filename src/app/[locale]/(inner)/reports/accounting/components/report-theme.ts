import { semanticPalette } from "@/lib/constants/color-palette";

const { haze } = semanticPalette;

export const reportTheme = {
  chart: {
    period: haze[600],
  },
  kpi: {
    value: "text-haze-800",
    neutral: "text-gray-700",
  },
} as const;
