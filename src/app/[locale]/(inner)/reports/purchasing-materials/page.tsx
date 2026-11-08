"use client";

import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import ReportPageHeader from "@/components/ui/report-page-header";
import { ShoppingCart } from "lucide-react";
import ReportLinkCard from "../components/report-link-card";
import PermissionGuard from "@/components/guards/permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

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
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_SPENDING_SUMMARY_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Purchases Summary", ar: "ملخص المشتريات" },
                description: {
                  en: "A consolidated overview of purchasing activity by period, supplier, and material, including order status distribution.",
                  ar: "نظرة شاملة على نشاط المشتريات حسب الفترة والمورد والمادة، مع توزيع حالات أوامر الشراء.",
                },
                href: "/reports/purchasing-materials/spending-summary",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_REQUISITION_FOLLOW_UP_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Purchase Requisition Follow-up", ar: "متابعة طلبات الشراء" },
                description: {
                  en: "Monitors approved requisition lines by production department across requested, ordered, and received quantities and values.",
                  ar: "متابعة بنود طلبات الشراء المعتمدة حسب قسم الإنتاج عبر الكميات والقيم المطلوبة والمدرجة في أوامر التوريد والمستلمة.",
                },
                href: "/reports/purchasing-materials/requisition-follow-up",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_CATEGORY_STATS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Purchasing by Category", ar: "المشتريات حسب الفئة" },
                description: {
                  en: "Purchase statistics for a selected main category, covering suppliers, invoices, and leading materials.",
                  ar: "إحصائيات المشتريات لفئة رئيسية محددة، وتشمل الموردين والفواتير وأبرز المواد.",
                },
                href: "/reports/purchasing-materials/category-stats",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_SUBCATEGORY_STATS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Purchasing by Subcategory", ar: "المشتريات حسب الفئة الفرعية" },
                description: {
                  en: "Purchase statistics for a selected subcategory, covering suppliers, invoices, and materials.",
                  ar: "إحصائيات المشتريات لفئة فرعية محددة، وتشمل الموردين والفواتير والمواد.",
                },
                href: "/reports/purchasing-materials/subcategory-stats",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_SUPPLIER_STATS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Purchasing by Supplier", ar: "المشتريات حسب المورد" },
                description: {
                  en: "Purchase statistics for a selected supplier, covering value trends, categories, orders, and materials.",
                  ar: "إحصائيات المشتريات لمورد محدد، وتشمل اتجاه القيمة والفئات وأوامر التوريد والمواد.",
                },
                href: "/reports/purchasing-materials/supplier-stats",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_SUPPLIER_COMPARISON_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Supplier Comparison", ar: "مقارنة الموردين" },
                description: {
                  en: "Compares two suppliers on shared materials in terms of prices, volumes, and potential savings.",
                  ar: "مقارنة بين موردين على المواد المشتركة من حيث الأسعار والكميات والتوفير المحتمل.",
                },
                href: "/reports/purchasing-materials/supplier-comparison",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_PRICE_HISTORY_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Material Price History", ar: "تاريخ أسعار المادة" },
                description: {
                  en: "Tracks unit price changes for a selected material over time across purchase orders.",
                  ar: "تتبع تغيرات سعر الوحدة لمادة محددة عبر أوامر التوريد بمرور الوقت.",
                },
                href: "/reports/purchasing-materials/price-history",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_REQUISITION_HISTORY_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Material Requisition History", ar: "تاريخ طلبات شراء المادة" },
                description: {
                  en: "Tracks purchase requisitions for a selected material over time across production departments.",
                  ar: "تتبع طلبات شراء مادة محددة عبر أقسام الإنتاج بمرور الوقت.",
                },
                href: "/reports/purchasing-materials/requisition-history",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_AVERAGE_PRICE_GAPS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Average Price Gaps", ar: "فروقات السعر المتوسط" },
                description: {
                  en: "Identifies materials whose stored average price differs sharply from the quantity-weighted purchase price.",
                  ar: "تحديد المواد التي يختلف سعرها المتوسط المخزن بشكل حاد عن متوسط أسعار الشراء المرجح بالكمية.",
                },
                href: "/reports/purchasing-materials/average-price-gaps",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_PRICE_OUTLIERS_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Price Outliers", ar: "انحراف أسعار الشراء" },
                description: {
                  en: "Identifies purchase lines whose unit price diverges sharply from nearby purchases of the same material.",
                  ar: "تحديد بنود الشراء التي يختلف سعر وحدتها بشكل حاد عن المشتريات المجاورة لنفس المادة.",
                },
                href: "/reports/purchasing-materials/price-outliers",
              }}
            />
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.READ_MATERIAL_PURCHASING_TOTAL_AMOUNT_MISMATCHES_REPORT}>
            <ReportLinkCard
              report={{
                label: { en: "Invoice Total Variance", ar: "انحراف إجمالي الفاتورة" },
                description: {
                  en: "Compares calculated purchase order totals with invoice total purchases.",
                  ar: "مقارنة الإجمالي المحسوب لأوامر التوريد مع إجمالي مشتريات الفاتورة.",
                },
                href: "/reports/purchasing-materials/total-amount-mismatches",
              }}
            />
          </PermissionGuard>
        </div>
      </main>
    </div>
  );
}
