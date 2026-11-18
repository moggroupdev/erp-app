"use client";

import {
  Ban,
  ClipboardList,
  FileText,
  Layers,
  Package,
  StickyNote,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { LegacyIssuePermitSummaryOverview } from "@/types/reports";
import { reportTheme } from "./report-theme";

export default function OverviewStats({ overview }: { overview: LegacyIssuePermitSummaryOverview }) {
  const { translate } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label={translate("Total Permits", "إجمالي الأذونات")}
        value={overview.permitCount}
        hint={translate("All legacy issue permits in the selected period.", "كل أذونات الصرف المرحلية في الفترة المحددة.")}
        icon={<ClipboardList size={20} />}
        valueClassName={reportTheme.kpi.value}
      />
      <KpiCard
        label={translate("Active Permits", "الأذونات النشطة")}
        value={overview.activePermitCount}
        hint={translate("Permits that are not cancelled.", "الأذونات غير الملغاة.")}
        icon={<Package size={20} />}
        valueClassName={reportTheme.kpi.positive}
      />
      <KpiCard
        label={translate("Cancelled Permits", "الأذونات الملغاة")}
        value={overview.cancelledPermitCount}
        hint={translate("Cancelled permits remain in totals.", "الأذونات الملغاة تبقى ضمن الإجماليات.")}
        icon={<Ban size={20} />}
        valueClassName={reportTheme.kpi.negative}
      />
      <KpiCard
        label={translate("Line Items", "بنود الأذونات")}
        value={overview.itemCount}
        hint={translate(
          `${overview.materialLineCount} material lines, ${overview.noteOnlyLineCount} note-only.`,
          `${overview.materialLineCount} بنود مواد، ${overview.noteOnlyLineCount} بنود ملاحظات فقط.`,
        )}
        icon={<Layers size={20} />}
      />
      <KpiCard
        label={translate("Empty Permits", "أذونات فارغة")}
        value={overview.emptyPermitCount}
        hint={translate("Permits with no line items.", "أذونات بدون بنود.")}
        icon={<FileText size={20} />}
        valueClassName={overview.emptyPermitCount > 0 ? reportTheme.kpi.warning : reportTheme.kpi.neutral}
      />
      <KpiCard
        label={translate("With Issue Order", "بأمر صرف")}
        value={overview.permitsWithIssueOrder}
        hint={translate("Permits that include an issue order number.", "أذونات تتضمن رقم أمر صرف.")}
        icon={<ClipboardList size={20} />}
      />
      <KpiCard
        label={translate("Multiple Customers", "عدة عملاء")}
        value={overview.multipleCustomerPermitCount}
        hint={translate("Permits marked as covering multiple customers.", "أذونات مميزة بأنها لعدة عملاء.")}
        icon={<Users size={20} />}
      />
      <KpiCard
        label={translate("Distinct Materials", "مواد مميزة")}
        value={overview.distinctMaterialCount}
        hint={translate(
          `${overview.distinctCustomerCount} customers, ${overview.distinctCreatorCount} creators.`,
          `${overview.distinctCustomerCount} عملاء، ${overview.distinctCreatorCount} منشئون.`,
        )}
        icon={<Package size={20} />}
      />
      <KpiCard
        label={translate("Header Notes", "ملاحظات الرأس")}
        value={overview.headerNoteCount}
        hint={translate("Permits with non-empty header notes.", "أذونات بملاحظات رأس غير فارغة.")}
        icon={<StickyNote size={20} />}
      />
      <KpiCard
        label={translate("Line Notes", "ملاحظات البنود")}
        value={overview.lineNoteCount}
        hint={translate("Line items with non-empty notes.", "بنود بملاحظات غير فارغة.")}
        icon={<StickyNote size={20} />}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  valueClassName = reportTheme.kpi.neutral,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
      <div className="absolute -end-3 -top-3 opacity-[0.07]">{icon}</div>
      <div className="relative flex flex-col gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
          {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
