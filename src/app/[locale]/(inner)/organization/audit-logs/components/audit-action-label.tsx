"use client";

import { Circle, Minus, Plus, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getAuditActionLabel, type AuditAction } from "@/lib/constants/enums/audit-actions";

const ACTION_CONFIG: Record<
  AuditAction,
  { className: string; icon: LucideIcon; size?: number; fill?: string }
> = {
  insert: { className: "text-teal-600", icon: Plus },
  update: { className: "text-yellow-600", icon: Circle, size: 8, fill: "currentColor" },
  delete: { className: "text-red-600", icon: Minus },
};

type AuditActionLabelProps = {
  action: AuditAction;
};

export default function AuditActionLabel({ action }: AuditActionLabelProps) {
  const { locale } = useI18n();
  const config = ACTION_CONFIG[action];
  const Icon = config?.icon;

  return (
    <div className={`flex items-center gap-1 font-bold ${config?.className ?? "text-gray-600"}`}>
      {Icon && <Icon size={config.size ?? 14} strokeWidth={2.5} fill={config.fill} />}
      {getAuditActionLabel(action, locale)}
    </div>
  );
}
