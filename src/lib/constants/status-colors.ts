import type { ColorThemeName } from "@/lib/constants/color-theme";

export type SemanticStatus = "success" | "info" | "warning" | "danger" | "accent";

type StatusColorTokens = {
  mantineColor: ColorThemeName;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
};

const STATUS_COLORS: Record<SemanticStatus, StatusColorTokens> = {
  success: {
    mantineColor: "teal",
    textClass: "text-teal-600",
    surfaceClass: "bg-teal-50",
    borderClass: "border-teal-200",
  },
  info: {
    mantineColor: "haze",
    textClass: "text-haze-600",
    surfaceClass: "bg-haze-50",
    borderClass: "border-haze-200",
  },
  warning: {
    mantineColor: "ochre",
    textClass: "text-ochre-600",
    surfaceClass: "bg-ochre-50",
    borderClass: "border-ochre-200",
  },
  danger: {
    mantineColor: "clay",
    textClass: "text-clay-600",
    surfaceClass: "bg-clay-50",
    borderClass: "border-clay-200",
  },
  accent: {
    mantineColor: "plum",
    textClass: "text-plum-600",
    surfaceClass: "bg-plum-50",
    borderClass: "border-plum-200",
  },
};

export function getSemanticStatusColors(status: SemanticStatus): StatusColorTokens {
  return STATUS_COLORS[status];
}
