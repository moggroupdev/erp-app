"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { ChartNoAxesCombined } from "lucide-react";
import ReportLinkCard from "./components/report-link-card";

const PAGE_TITLE = { en: "Reports", ar: "التقارير" };

const PAGE_SUBTITLE = {
  en: "Operational and financial insights organized by business area, with reports grouped by domain.",
  ar: "رؤى تشغيلية ومالية مرتبة حسب مجال العمل، مع تقارير مصنّفة حسب المجال.",
};

export default function Page() {
  const { translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  return (
    <div className="space-y-6">
      <ReportPageHeader
        breadcrumbs={[{ label: { en: "Dashboard", ar: "الرئيسية" }, href: "/dashboard" }, { label: PAGE_TITLE }]}
        icon={ChartNoAxesCombined}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
      />

      <main>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportLinkCard
            report={{
              label: { en: "Materials Reports", ar: "تقارير المواد" },
              description: {
                en: "Inventory value, stock levels, and category performance across warehouse materials.",
                ar: "قيمة المخزون ومستوياته وأداء الفئات المختلفة عبر المواد المخزنة.",
              },
              href: "/reports/materials",
            }}
          />
        </div>
      </main>
    </div>
  );
}
