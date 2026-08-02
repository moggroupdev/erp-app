import type { ReactNode } from "react";

export default function PrintDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
