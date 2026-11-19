import type { MaterialDeleteReferenceGroupKey } from "@/types/material";

export function getMaterialReferenceGroupLabel(
  key: MaterialDeleteReferenceGroupKey,
  translate: (en: string, ar: string) => string,
) {
  switch (key) {
    case "unitConversions":
      return translate("Extra units", "وحدات إضافية");
    case "ownMmBomLines":
      return translate("Components in this item's recipe", "مكونات في وصفة هذا الصنف");
    case "componentOfMmBoms":
      return translate("Used inside other item recipes", "مستخدم داخل وصفات أصناف أخرى");
    case "productBomLines":
      return translate("Used in product recipes", "مستخدم في وصفات المنتجات");
    case "purchaseRequisitions":
      return translate("Purchase requests", "طلبات الشراء");
    case "purchaseOrders":
      return translate("Purchase orders", "أوامر التوريد");
    case "inventoryTransactions":
      return translate("Stock movements", "حركات المخزون");
    case "legacyIssuePermits":
      return translate("Old issue permits", "أذون الصرف القديمة");
    case "maintenanceOrders":
      return translate("Maintenance orders", "أوامر الصيانة");
    case "outsourcingOrders":
      return translate("Outsourcing orders", "أوامر التصنيع الخارجي");
    case "requestForQuotations":
      return translate("Quotation requests", "طلبات عروض الأسعار");
    case "supplierQuotations":
      return translate("Supplier quotations", "عروض أسعار الموردين");
  }
}
