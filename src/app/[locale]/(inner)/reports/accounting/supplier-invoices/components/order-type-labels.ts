import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import type { AccountingSupplierInvoiceOrderType } from "@/types/reports";

export function getOrderTypeLabel(
  orderType: AccountingSupplierInvoiceOrderType,
  translate: (en: string, ar: string) => string,
) {
  if (orderType === "material") return translate("Material purchase order", "أمر توريد خامات");
  if (orderType === "product") return translate("Product purchase order", "أمر توريد منتجات");
  return translate("Outsourcing order", "تشغيل لدى الغير");
}

export function getOrderLink(
  orderType: AccountingSupplierInvoiceOrderType,
  orderId: string,
): { href: string; permission: Permission } | null {
  if (orderType === "material") {
    return {
      href: `/procurement/material-orders/${orderId}`,
      permission: PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS,
    };
  }
  return null;
}
