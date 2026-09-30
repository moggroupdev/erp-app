import { semanticTw, type ColorThemeName, type SemanticShadeKey } from "@/lib/constants/color-palette";

export type SemanticStatus = "success" | "info" | "warning" | "danger" | "accent";

type StatusColorTokens = {
  mantineColor: ColorThemeName;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
};

function tokens(name: ColorThemeName, textShade: SemanticShadeKey = 600, surfaceShade: SemanticShadeKey = 50, borderShade: SemanticShadeKey = 200): StatusColorTokens {
  return {
    mantineColor: name,
    textClass: semanticTw("text", name, textShade),
    surfaceClass: semanticTw("bg", name, surfaceShade),
    borderClass: semanticTw("border", name, borderShade),
  };
}

const STATUS_COLORS: Record<SemanticStatus, StatusColorTokens> = {
  success: tokens("teal"),
  info: tokens("haze"),
  warning: tokens("ochre"),
  danger: tokens("clay"),
  accent: tokens("plum"),
};

export function getSemanticStatusColors(status: SemanticStatus): StatusColorTokens {
  return STATUS_COLORS[status];
}
