"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { Boxes } from "lucide-react";
import ReportLinkCard from "../components/report-link-card";
import PermissionGuard from "@/components/guards/permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

const PAGE_TITLE = {
  en: "Inventory Reports",
  ar: "تقارير المخزون",
};

const PAGE_SUBTITLE = {
  en: "Inventory analytics for raw materials and spare parts, covering inventory value, stock health, and performance within a specific category.",
  ar: "تحليلات مخزون للمواد الخام وقطع الغيار، تشمل قيمة وصحة المخزون والأداء ضمن فئة محددة.",
};

export default function Page() {
  const { translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[
          { label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" },
          { label: { en: "Reports", ar: "التقارير" }, href: "/reports" },
          { label: PAGE_TITLE },
        ]}
        icon={Boxes}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
      />

      <main>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_INVENTORY_SUMMARY_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Inventory Summary", ar: "ملخص المخزون" },
                description: {
                  en: "Full warehouse overview with total inventory value, breakdown by type and category, and items requiring replenishment.",
                  ar: "نظرة شاملة على المستودع تشمل إجمالي قيمة المخزون والتوزيع حسب النوع والفئة والمواد التي تحتاج إعادة تزويد.",
                },
                href: "/reports/materials/inventory-summary",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_CATEGORY_STATS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Category Stats", ar: "إحصائيات الفئة" },
                description: {
                  en: "Analysis within one main category, covering subcategory comparison, low-stock items, and highest-value materials.",
                  ar: "تحليل ضمن فئة رئيسية واحدة يشمل مقارنة الفئات الفرعية ومواد منخفضة المخزون وأعلى المواد قيمة.",
                },
                href: "/reports/materials/category-stats",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMIT_SUMMARY_REPORT}>
            <ReportLinkCard
              report={{
                label: {
                  en: "Legacy Issue Permit Summary",
                  ar: "ملخص أذونات الصرف المرحلية",
                },
                description: {
                  en: "Permit-wide volume, breakdowns, data-quality gaps, and recent notes across legacy issue permits.",
                  ar: "حجم أذونات الصرف المرحلية وتفصيلاتها وفجوات جودة البيانات وأحدث الملاحظات.",
                },
                href: "/reports/materials/legacy-issue-permit-summary",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_LEGACY_ISSUE_PERMIT_HISTORY_REPORT}>
            <ReportLinkCard
              report={{
                label: {
                  en: "Legacy Material Issue Permit History",
                  ar: "تاريخ أذونات الصرف المرحلية للمادة",
                },
                description: {
                  en: "Tracks interim legacy issue permits for a selected material over time across production departments. This is not the final issue-permit report.",
                  ar: "تتبع أذونات الصرف المرحلية لمادة محددة عبر أقسام الإنتاج بمرور الوقت. هذه ليست النسخة النهائية من تقرير أذونات الصرف.",
                },
                href: "/reports/materials/issue-permit-history",
              }}
            />
          </PermissionGuard>
        </div>
      </main>
    </div>
  );
}
