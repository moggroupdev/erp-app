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
