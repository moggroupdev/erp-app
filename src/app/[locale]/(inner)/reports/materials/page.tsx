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
  en: "A snapshot of warehouse materials. Total value, composition by type and category, stock health, and items that need attention.",
  ar: "لمحة عن مواد المخزن. القيمة الإجمالية، التكوين حسب النوع والفئة، صحة المخزون، والمواد التي تحتاج متابعة.",
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
              description: { en: "View a summary of materials in the warehouse", ar: "عرض ملخص للمواد في المخزن" },
              href: "/reports/materials/inventory-summary",
            }}
          />
          <ReportLinkCard
            report={{
              label: { en: "Category Stats", ar: "إحصائيات الفئة" },
              description: {
                en: "Stats for materials in a selected main category",
                ar: "إحصائيات المواد ضمن فئة رئيسية محددة",
              },
              href: "/reports/materials/category-stats",
            }}
          />
        </div>
      </main>
    </div>
  );
}
