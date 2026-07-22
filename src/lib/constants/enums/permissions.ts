import type { Locale, LocalizedEntity } from "@/lib/i18n/types";
import { translate } from "@/lib/i18n/utils";

export const PERMISSION_VALUES = [
  "add_user",
  "read_users",
  "update_user",
  "delete_user",
  "add_role",
  "read_roles",
  "update_role",
  "delete_role",
  "add_department",
  "read_departments",
  "update_department",
  "add_vendor",
  "read_vendors",
  "update_vendor",
  "add_customer",
  "read_customers",
  "update_customer",
  "read_products",
  "add_product",
  "update_product",
  "delete_product",
  "add_product_bom",
  "read_product_boms",
  "update_product_bom",
  "read_customers",
  "add_customer",
  "update_customer",
  "read_materials",
  "add_material",
  "update_material",
  "read_inquiries",
  "read_previews",
  "read_offers",
  "read_contracts",
  "read_receptions",
  "read_complaints",
  "read_production_plans",
  "read_production_routing",
  "read_inventory_transactions",
  "read_material_purchase_orders",
  "read_product_purchase_orders",
  "read_trips",
  "read_deliveries",
  "read_installations",
  "read_service_agreements",
  "read_maintenance_orders",
  "show_analytics",
  "read_material_reports",
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
  read_users: {
    value: "read_users",
    label: {
      en: "Read Users",
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
  read_roles: {
    value: "read_roles",
    label: {
      en: "Read Roles",
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
  read_departments: {
    value: "read_departments",
    label: {
      en: "Read Departments",
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
  read_vendors: {
    value: "read_vendors",
    label: {
      en: "Read Vendors",
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
  read_products: {
    value: "read_products",
    label: {
      en: "Read Products",
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
  add_product_bom: {
    value: "add_product_bom",
    label: {
      en: "Add BOM",
      ar: "إضافة قائمة مواد",
    },
  },
  read_product_boms: {
    value: "read_product_boms",
    label: {
      en: "Read BOMs",
      ar: "عرض قوائم المواد",
    },
  },
  update_product_bom: {
    value: "update_product_bom",
    label: {
      en: "Update BOM",
      ar: "تحديث قائمة المواد",
    },
  },
  read_customers: {
    value: "read_customers",
    label: {
      en: "Read Customers",
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
  read_inquiries: {
    value: "read_inquiries",
    label: {
      en: "Read Inquiries",
      ar: "عرض الاستفسارات",
    },
  },
  read_previews: {
    value: "read_previews",
    label: {
      en: "Read Previews",
      ar: "عرض المعاينات",
    },
  },
  read_offers: {
    value: "read_offers",
    label: {
      en: "Read Offers",
      ar: "عرض العروض",
    },
  },
  read_contracts: {
    value: "read_contracts",
    label: {
      en: "Read Contracts",
      ar: "عرض العقود",
    },
  },
  read_complaints: {
    value: "read_complaints",
    label: {
      en: "Read Complaints",
      ar: "عرض الشكاوي",
    },
  },
  read_receptions: {
    value: "read_receptions",
    label: {
      en: "Read Receptions",
      ar: "عرض الاستلامات",
    },
  },
  read_production_plans: {
    value: "read_production_plans",
    label: {
      en: "Read Production Plans",
      ar: "عرض خطط الإنتاج",
    },
  },
  read_production_routing: {
    value: "read_production_routing",
    label: {
      en: "Read Production Routing",
      ar: "عرض مسارات الإنتاج",
    },
  },
  read_materials: {
    value: "read_materials",
    label: {
      en: "Read Materials",
      ar: "عرض المواد",
    },
  },
  add_material: {
    value: "add_material",
    label: {
      en: "Add Material",
      ar: "إضافة مادة",
    },
  },
  update_material: {
    value: "update_material",
    label: {
      en: "Update Material",
      ar: "تحديث المادة",
    },
  },

  read_inventory_transactions: {
    value: "read_inventory_transactions",
    label: {
      en: "Read Inventory Transactions",
      ar: "عرض حركات المخزون",
    },
  },
  read_material_purchase_orders: {
    value: "read_material_purchase_orders",
    label: {
      en: "Read Material Purchase Orders",
      ar: "عرض أوامر شراء المواد",
    },
  },
  read_product_purchase_orders: {
    value: "read_product_purchase_orders",
    label: {
      en: "Read Product Purchase Orders",
      ar: "عرض أوامر شراء المنتجات",
    },
  },
  read_trips: {
    value: "read_trips",
    label: {
      en: "Read Trips",
      ar: "عرض الرحلات",
    },
  },
  read_deliveries: {
    value: "read_deliveries",
    label: {
      en: "Read Deliveries",
      ar: "عرض التسليمات",
    },
  },
  read_installations: {
    value: "read_installations",
    label: {
      en: "Read Installations",
      ar: "عرض التركيبات",
    },
  },
  read_service_agreements: {
    value: "read_service_agreements",
    label: {
      en: "Read Service Agreements",
      ar: "عرض اتفاقيات الخدمة",
    },
  },
  read_maintenance_orders: {
    value: "read_maintenance_orders",
    label: {
      en: "Read Maintenance Orders",
      ar: "عرض أوامر الصيانة",
    },
  },
  read_material_reports: {
    value: "read_material_reports",
    label: {
      en: "Read Material Reports",
      ar: "عرض تقارير المواد",
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

// ================ Domains ================

export type PermissionDomain =
  | "organization"
  | "sales"
  | "engineering"
  | "production"
  | "warehouse"
  | "procurement"
  | "fulfillment"
  | "maintenance"
  | "reports"
  | "analytics";

export type PermissionDomainGroup = {
  domain: PermissionDomain;
  label: { en: string; ar: string };
  permissions: Permission[];
};

/** Permission groups aligned with sidebar domains. */
export const PERMISSION_DOMAIN_GROUPS: PermissionDomainGroup[] = [
  {
    domain: "organization",
    label: { en: "Organization", ar: "المؤسسة" },
    permissions: [
      "add_user",
      "read_users",
      "update_user",
      "delete_user",
      "add_role",
      "read_roles",
      "update_role",
      "delete_role",
      "add_department",
      "read_departments",
      "update_department",
    ],
  },
  {
    domain: "sales",
    label: { en: "Sales & Customers", ar: "المبيعات والعملاء" },
    permissions: [
      "add_customer",
      "read_customers",
      "update_customer",
      "read_inquiries",
      "read_previews",
      "read_offers",
      "read_contracts",
      "read_receptions",
      "read_complaints",
    ],
  },
  {
    domain: "engineering",
    label: { en: "Products & Engineering", ar: "المنتجات والهندسة" },
    permissions: [
      "read_products",
      "add_product",
      "update_product",
      "delete_product",
      "add_product_bom",
      "read_product_boms",
      "update_product_bom",
    ],
  },
  {
    domain: "production",
    label: { en: "Production", ar: "الإنتاج" },
    permissions: ["read_production_plans", "read_production_routing"],
  },
  {
    domain: "warehouse",
    label: { en: "Warehouse", ar: "المخازن" },
    permissions: ["read_materials", "add_material", "update_material", "read_inventory_transactions"],
  },
  {
    domain: "procurement",
    label: { en: "Procurement", ar: "المشتريات" },
    permissions: [
      "add_vendor",
      "read_vendors",
      "update_vendor",
      "read_material_purchase_orders",
      "read_product_purchase_orders",
    ],
  },
  {
    domain: "fulfillment",
    label: { en: "Delivery & Installation", ar: "التسليم والتركيب" },
    permissions: ["read_trips", "read_deliveries", "read_installations"],
  },
  {
    domain: "maintenance",
    label: { en: "Maintenance & Service", ar: "الصيانة والخدمة" },
    permissions: ["read_service_agreements", "read_maintenance_orders"],
  },
  {
    domain: "reports",
    label: { en: "Reports", ar: "التقارير" },
    permissions: ["read_material_reports"],
  },
  {
    domain: "analytics",
    label: { en: "Analytics", ar: "التحليلات" },
    permissions: ["show_analytics"],
  },
];
