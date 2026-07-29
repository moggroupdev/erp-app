import type { ReactNode } from "react";

export default function PrintSectionHeading({ title, subtitle }: { title: ReactNode; subtitle?: string }) {
  return (
    <div className="flex break-after-avoid flex-col gap-0.5">
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-[10px] leading-snug text-gray-500">{subtitle}</p>}
    </div>
  );
}
