"use client";

import { Circle, Minus, Plus, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getAuditedTableLabel } from "@/lib/constants/audit-tables";
import { type AuditAction } from "@/lib/constants/enums/audit-actions";
import type { AuditLogDetailed } from "@/types/audit-log";
import CopyButton from "@/components/ui/copy-button";

const ACTION_HEADER: Record<
  AuditAction,
  {
    icon: LucideIcon;
    verb: { en: string; ar: string };
    bar: string;
    iconWrap: string;
    verbClass: string;
  }
> = {
  insert: {
    icon: Plus,
    verb: { en: "Inserting", ar: "إضافة" },
    bar: "bg-teal-500",
    iconWrap: "bg-teal-50 text-teal-600 ring-teal-100",
    verbClass: "text-teal-700",
  },
  update: {
    icon: Circle,
    verb: { en: "Updating", ar: "تحديث" },
    bar: "bg-yellow-500",
    iconWrap: "bg-yellow-50 text-yellow-600 ring-yellow-100",
    verbClass: "text-yellow-700",
  },
  delete: {
    icon: Minus,
    verb: { en: "Deleting", ar: "حذف" },
    bar: "bg-red-500",
    iconWrap: "bg-red-50 text-red-600 ring-red-100",
    verbClass: "text-red-700",
  },
};

type AuditLogHeaderProps = {
  log: AuditLogDetailed;
};

export default function AuditLogHeader({ log }: AuditLogHeaderProps) {
  const { locale, translate } = useI18n();
  const tableLabel = getAuditedTableLabel(log.tableName, locale);
  const action = ACTION_HEADER[log.action] ?? ACTION_HEADER.update;
  const Icon = action.icon;
  const verb = translate(action.verb.en, action.verb.ar);
  const tableTitle = locale === "ar" ? `جدول ${tableLabel}` : `${tableLabel} Table`;

  return (
    <header className="overflow-hidden border-y-3 border-dashed border-gray-500/15 bg-gray-50/25 px-4 py-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 sm:size-14 ${action.iconWrap}`}
        >
          <Icon
            size={log.action === "update" ? 14 : 22}
            strokeWidth={2.5}
            fill={log.action === "update" ? "currentColor" : "none"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className={`text-sm font-bold tracking-wide ${action.verbClass}`}>{verb}</p>
          <h2 className="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl">{tableTitle}</h2>
          <p className="my-1 text-sm text-gray-500">{translate("on the Record ID", "على معرف السجل")}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold break-all text-gray-800 sm:text-sm">
              {log.recordId}
            </span>
            <CopyButton text={log.recordId} />
          </div>
        </div>
      </div>
    </header>
  );
}
