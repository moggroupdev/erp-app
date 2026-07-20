"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { ChartNoAxesCombined } from "lucide-react";
import ReportLinkCard from "./components/report-link-card";

const PAGE_TITLE = { en: "Reports", ar: "التقارير" };

const PAGE_SUBTITLE = {
  en: "Browse reports by business domain. Select a domain to see available reports.",
  ar: "تصفح التقارير حسب مجال العمل. اختر مجالاً لعرض التقارير المتاحة.",
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
              description: { en: "View reports about materials", ar: "عرض تقارير عن المواد" },
              href: "/reports/materials",
            }}
          />
        </div>
      </main>
    </div>
  );
}
