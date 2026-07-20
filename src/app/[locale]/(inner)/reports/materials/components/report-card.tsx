import type { LucideIcon } from "lucide-react";

const iconStyles = {
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-stone-100 text-stone-600",
  sky: "bg-sky-100 text-sky-700",
};

export default function ReportCard({
  title,
  description,
  icon: Icon,
  children,
  className = "",
  accent = "slate",
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  accent?: "teal" | "amber" | "slate" | "sky";
}) {
  return (
    <article className={`overflow-hidden rounded-3xl bg-white ${className}`}>
      <header className="border-b border-dashed border-stone-200 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyles[accent]}`}>
              <Icon size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
            {description && <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>}
          </div>
        </div>
      </header>

      <div className="px-5 py-5 sm:px-6">{children}</div>
    </article>
  );
}
