"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { Boxes } from "lucide-react";
import ReportLinkCard from "../components/report-link-card";

const PAGE_TITLE = {
  en: "Materials Reports",
  ar: "تقارير المواد",
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
          <ReportLinkCard
            report={{
              label: { en: "Materials Summary", ar: "ملخص المواد" },
              description: {
                en: "Full warehouse overview with total inventory value, breakdown by type and category, and items requiring replenishment.",
                ar: "نظرة شاملة على المستودع تشمل إجمالي قيمة المخزون والتوزيع حسب النوع والفئة والمواد التي تحتاج إعادة تزويد.",
              },
              href: "/reports/materials/inventory-summary",
            }}
          />
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
        </div>
      </main>
    </div>
  );
}
