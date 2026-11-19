"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { Landmark } from "lucide-react";
import ReportLinkCard from "../components/report-link-card";
import PermissionGuard from "@/components/guards/permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

const PAGE_TITLE = {
  en: "Accounting Reports",
  ar: "تقارير الحسابات",
};

const PAGE_SUBTITLE = {
  en: "Invoice and financial reports for accounting workflows.",
  ar: "تقارير الفواتير والمالية لسير عمل الحسابات.",
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
        icon={Landmark}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
      />

      <main>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PermissionGuard permission={PERMISSIONS.READ_ACCOUNTING_SUPPLIER_INVOICES_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Supplier Invoices", ar: "فواتير المورد" },
                description: {
                  en: "All invoices for a selected supplier, with money totals, order-type breakdown, and issue-date trend.",
                  ar: "جميع فواتير مورد محدد، مع إجماليات المبالغ وتفصيل نوع الأمر واتجاه تاريخ الإصدار.",
                },
                href: "/reports/accounting/supplier-invoices",
              }}
            />
          </PermissionGuard>
        </div>
      </main>
    </div>
  );
}
