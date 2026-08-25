"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { ShoppingCart } from "lucide-react";
import ReportLinkCard from "../components/report-link-card";

const PAGE_TITLE = {
  en: "Purchases Reports",
  ar: "تقارير المشتريات",
};

const PAGE_SUBTITLE = {
  en: "Spending analytics for purchases, covering cost trends, supplier rankings, and price history.",
  ar: "تحليلات الإنفاق على المشتريات، تشمل اتجاهات التكلفة وترتيب الموردين وتاريخ الأسعار.",
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
        icon={ShoppingCart}
        title={translate(PAGE_TITLE.en, PAGE_TITLE.ar)}
        subtitle={translate(PAGE_SUBTITLE.en, PAGE_SUBTITLE.ar)}
      />

      <main>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportLinkCard
            report={{
              label: { en: "Spending Summary", ar: "ملخص الإنفاق" },
              description: {
                en: "Total spend overview by period, supplier, and material with order status breakdown.",
                ar: "نظرة شاملة على الإنفاق حسب الفترة والمورد والمادة مع تفصيل حالات الطلبات.",
              },
              href: "/reports/purchasing-materials/spending-summary",
            }}
          />
          <ReportLinkCard
            report={{
              label: { en: "Price History", ar: "تاريخ الأسعار" },
              description: {
                en: "Track unit price changes for a specific material over time across purchase orders.",
                ar: "تتبع تغيرات سعر الوحدة لمادة محددة عبر أوامر الشراء بمرور الوقت.",
              },
              href: "/reports/purchasing-materials/price-history",
            }}
          />
          <ReportLinkCard
            report={{
              label: { en: "Purchasing by Category", ar: "المشتريات حسب الفئة" },
              description: {
                en: "Purchase stats for one main category: suppliers, invoices, and top materials.",
                ar: "إحصائيات المشتريات لفئة رئيسية واحدة: الموردون والفواتير وأعلى المواد.",
              },
              href: "/reports/purchasing-materials/category-stats",
            }}
          />
          <ReportLinkCard
            report={{
              label: { en: "Purchasing by Subcategory", ar: "المشتريات حسب الفئة الفرعية" },
              description: {
                en: "Purchase stats for one subcategory: suppliers, invoices, and materials.",
                ar: "إحصائيات المشتريات لفئة فرعية واحدة: الموردون والفواتير والمواد.",
              },
              href: "/reports/purchasing-materials/subcategory-stats",
            }}
          />
          <ReportLinkCard
            report={{
              label: { en: "Purchasing by Supplier", ar: "المشتريات حسب المورد" },
              description: {
                en: "Purchase stats for one supplier: value trend, categories, orders, and materials.",
                ar: "إحصائيات المشتريات لمورد واحد: اتجاه القيمة والفئات وأوامر الشراء والمواد.",
              },
              href: "/reports/purchasing-materials/supplier-stats",
            }}
          />
        </div>
      </main>
    </div>
  );
}
