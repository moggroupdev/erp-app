import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PERMISSION_VALUES = [
  "add_user",
  "list_users",
  "update_user",
  "delete_user",
  "add_role",
  "list_roles",
  "update_role",
  "delete_role",
  "show_analytics",
  "list_departments",
  "add_department",
  "update_department",
  "list_vendors",
  "add_vendor",
  "update_vendor",
  "list_products",
  "add_product",
  "update_product",
  "delete_product",
  "list_customers",
  "add_customer",
  "update_customer",
  "list_inquiries",
  "list_previews",
  "list_offers",
  "list_contracts",
  "list_receptions",
  "list_boms",
  "list_production_plans",
  "list_production_routing",
  "list_materials",
  "list_inventory_transactions",
  "list_material_purchase_orders",
  "list_product_purchase_orders",
  "list_trips",
  "list_deliveries",
  "list_installations",
  "list_service_agreements",
  "list_maintenance_orders",
] as const;

export type Permission = (typeof PERMISSION_VALUES)[number];

export const PERMISSIONS = Object.fromEntries(
  PERMISSION_VALUES.map((permission) => [permission.toUpperCase(), permission]),
) as {
  [K in Uppercase<Permission>]: Lowercase<K>;
};

// ================ Labels ================

export const PERMISSION_LABELS: LocalizedEntity<Permission> = {
  add_user: {
    value: "add_user",
    label: {
      en: "Add User",
      ar: "إضافة مستخدم",
    },
  },
  list_users: {
    value: "list_users",
    label: {
      en: "List Users",
      ar: "عرض المستخدمين",
    },
  },
  update_user: {
    value: "update_user",
    label: {
      en: "Update User",
      ar: "تحديث المستخدم",
    },
  },
  delete_user: {
    value: "delete_user",
    label: {
      en: "Delete User",
      ar: "حذف المستخدم",
    },
  },
  add_role: {
    value: "add_role",
    label: {
      en: "Add Role",
      ar: "إضافة الدور",
    },
  },
  list_roles: {
    value: "list_roles",
    label: {
      en: "List Roles",
      ar: "عرض الدور",
    },
  },
  update_role: {
    value: "update_role",
    label: {
      en: "Update Role",
      ar: "تحديث الدور",
    },
  },
  delete_role: {
    value: "delete_role",
    label: {
      en: "Delete Role",
      ar: "حذف الدور",
    },
  },
  show_analytics: {
    value: "show_analytics",
    label: {
      en: "Show Analytics",
      ar: "عرض التحليلات",
    },
  },
  list_departments: {
    value: "list_departments",
    label: {
      en: "List Departments",
      ar: "عرض الأقسام",
    },
  },
  add_department: {
    value: "add_department",
    label: {
      en: "Add Department",
      ar: "إضافة قسم",
    },
  },
  update_department: {
    value: "update_department",
    label: {
      en: "Update Department",
      ar: "تحديث القسم",
    },
  },
  list_vendors: {
    value: "list_vendors",
    label: {
      en: "List Vendors",
      ar: "عرض الموردين",
    },
  },
  add_vendor: {
    value: "add_vendor",
    label: {
      en: "Add Vendor",
      ar: "إضافة مورد",
    },
  },
  update_vendor: {
    value: "update_vendor",
    label: {
      en: "Update Vendor",
      ar: "تحديث المورد",
    },
  },
  list_products: {
    value: "list_products",
    label: {
      en: "List Products",
      ar: "عرض المنتجات",
    },
  },
  add_product: {
    value: "add_product",
    label: {
      en: "Add Product",
      ar: "إضافة منتج",
    },
  },
  update_product: {
    value: "update_product",
    label: {
      en: "Update Product",
      ar: "تحديث المنتج",
    },
  },
  delete_product: {
    value: "delete_product",
    label: {
      en: "Delete Product",
      ar: "حذف المنتج",
    },
  },
  list_customers: {
    value: "list_customers",
    label: {
      en: "List Customers",
      ar: "عرض العملاء",
    },
  },
  add_customer: {
    value: "add_customer",
    label: {
      en: "Add Customer",
      ar: "إضافة عميل",
    },
  },
  update_customer: {
    value: "update_customer",
    label: {
      en: "Update Customer",
      ar: "تحديث العميل",
    },
  },
  list_inquiries: {
    value: "list_inquiries",
    label: {
      en: "List Inquiries",
      ar: "عرض الاستفسارات",
    },
  },
  list_previews: {
    value: "list_previews",
    label: {
      en: "List Previews",
      ar: "عرض المعاينات",
    },
  },
  list_offers: {
    value: "list_offers",
    label: {
      en: "List Offers",
      ar: "عرض العروض",
    },
  },
  list_contracts: {
    value: "list_contracts",
    label: {
      en: "List Contracts",
      ar: "عرض العقود",
    },
  },
  list_receptions: {
    value: "list_receptions",
    label: {
      en: "List Receptions",
      ar: "عرض الاستلامات",
    },
  },
  list_boms: {
    value: "list_boms",
    label: {
      en: "List BOMs",
      ar: "عرض قوائم المواد",
    },
  },
  list_production_plans: {
    value: "list_production_plans",
    label: {
      en: "List Production Plans",
      ar: "عرض خطط الإنتاج",
    },
  },
  list_production_routing: {
    value: "list_production_routing",
    label: {
      en: "List Production Routing",
      ar: "عرض مسارات الإنتاج",
    },
  },
  list_materials: {
    value: "list_materials",
    label: {
      en: "List Materials",
      ar: "عرض المواد",
    },
  },
  list_inventory_transactions: {
    value: "list_inventory_transactions",
    label: {
      en: "List Inventory Transactions",
      ar: "عرض حركات المخزون",
    },
  },
  list_material_purchase_orders: {
    value: "list_material_purchase_orders",
    label: {
      en: "List Material Purchase Orders",
      ar: "عرض أوامر شراء المواد",
    },
  },
  list_product_purchase_orders: {
    value: "list_product_purchase_orders",
    label: {
      en: "List Product Purchase Orders",
      ar: "عرض أوامر شراء المنتجات",
    },
  },
  list_trips: {
    value: "list_trips",
    label: {
      en: "List Trips",
      ar: "عرض الرحلات",
    },
  },
  list_deliveries: {
    value: "list_deliveries",
    label: {
      en: "List Deliveries",
      ar: "عرض التسليمات",
    },
  },
  list_installations: {
    value: "list_installations",
    label: {
      en: "List Installations",
      ar: "عرض التركيبات",
    },
  },
  list_service_agreements: {
    value: "list_service_agreements",
    label: {
      en: "List Service Agreements",
      ar: "عرض اتفاقيات الخدمة",
    },
  },
  list_maintenance_orders: {
    value: "list_maintenance_orders",
    label: {
      en: "List Maintenance Orders",
      ar: "عرض أوامر الصيانة",
    },
  },
};

export const PERMISSION_LABELS_LIST = Object.values(PERMISSION_LABELS);

// ================ Helpers ================

export function getPermissionLabel(permission: Permission, locale: Locale) {
  if (!PERMISSION_LABELS[permission]) {
    console.warn(`Permission \`${permission}\` does not exist in predefined labels.`);
    return permission; // Return the value itself
  } else return translate(locale, PERMISSION_LABELS[permission].label.en, PERMISSION_LABELS[permission].label.ar);
}

export function isValidPermission(permission: string): permission is Permission {
  return PERMISSION_VALUES.includes(permission as Permission);
}
