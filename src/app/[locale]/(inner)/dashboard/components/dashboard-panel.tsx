import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const iconStyles = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-ochre-50 text-ochre-700",
  gray: "bg-gray-100 text-gray-600",
  sky: "bg-haze-50 text-haze-700",
  clay: "bg-clay-50 text-clay-700",
  plum: "bg-plum-50 text-plum-700",
} as const;

export type DashboardPanelAccent = keyof typeof iconStyles;

export default function DashboardPanel({
  title,
  description,
  icon: Icon,
  accent = "gray",
  trailing,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: DashboardPanelAccent;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white ${className}`}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyles[accent]}`}>
              <Icon size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-gray-800">{title}</h3>
            {description && <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </article>
  );
}
