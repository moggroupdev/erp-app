"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { LegacyIssuePermitSummaryDataQualityNote } from "@/types/reports";
import ReportCard from "./report-card";

export default function DataQualityNotes({ data }: { data: LegacyIssuePermitSummaryDataQualityNote[] }) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("Data Quality Notes", "ملاحظات جودة البيانات")}
      description={translate(
        "Counts of optional gaps that the schema allows on legacy issue permits.",
        "عدادات للفجوات الاختيارية التي يسمح بها النموذج على أذونات الصرف المرحلية.",
      )}
      icon={AlertTriangle}
      accent="amber"
    >
      {data.every((note) => note.count === 0) ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {translate("No data-quality gaps in this range.", "لا توجد فجوات جودة بيانات في هذا النطاق.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((note) => (
            <li
              key={note.code}
              className="flex items-start justify-between gap-4 rounded-xl bg-ochre-50 px-4 py-3 text-sm text-ochre-800"
            >
              <p className="leading-relaxed">{locale === "ar" ? note.caption.ar : note.caption.en}</p>
              <span className="shrink-0 text-lg font-semibold">{note.count}</span>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
