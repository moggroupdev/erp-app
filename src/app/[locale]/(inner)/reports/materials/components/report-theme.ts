export const reportTheme = {
  hero: "from-slate-800 via-slate-800 to-teal-900",
  surface: "bg-stone-50/80",
  card: "bg-white border border-stone-200/80 shadow-sm",
  accent: "#0d9488",
  accentMuted: "#99f6e4",
  chart: {
    materialTypes: ["#0d9488", "#78716c"],
    stockStatus: {
      out_of_stock: "#a8a29e",
      low_stock: "#d97706",
      in_stock: "#059669",
    },
    categoryBar: "#0f766e",
    categoryBarHover: "#115e59",
  },
  kpi: {
    value: "text-teal-800",
    neutral: "text-stone-700",
    positive: "text-emerald-700",
    negative: "text-rose-700",
    warning: "text-amber-700",
    info: "text-sky-700",
  },
} as const;
