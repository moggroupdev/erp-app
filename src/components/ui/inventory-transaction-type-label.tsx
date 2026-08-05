"use client";

import { Minus, Plus, Undo2, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import {
  getInventoryTransactionTypeLabel,
  type InventoryTransactionType,
} from "@/lib/constants/enums/inventory-transaction-types";

const TYPE_CONFIG: Record<InventoryTransactionType, { className: string; icon: LucideIcon }> = {
  receipt: { className: "text-teal-600", icon: Plus },
  issue: { className: "text-orange-500", icon: Minus },
  return: { className: "text-indigo-500", icon: Undo2 },
};

type InventoryTransactionTypeLabelProps = {
  type: InventoryTransactionType;
};

export default function InventoryTransactionTypeLabel({ type }: InventoryTransactionTypeLabelProps) {
  const { locale } = useI18n();
  const config = TYPE_CONFIG[type];
  const Icon = config?.icon;

  return (
    <div className={`flex items-center gap-1 font-bold ${config?.className ?? "text-gray-600"}`}>
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      {getInventoryTransactionTypeLabel(type, locale)}
    </div>
  );
}
