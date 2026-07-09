import type { LucideIcon } from "lucide-react";
import { UserState } from "@/types/user";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import {
  BadgeDollarSign,
  Boxes,
  Building2,
  ClipboardList,
  Factory,
  FileSearch,
  FileText,
  HandCoins,
  Hammer,
  Home,
  PackageSearch,
  ReceiptText,
  Route,
  Settings2,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

// =============== TYPES ===============

export type SidebarLeafConfig = {
  label: { en: string; ar: string };
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  adminOnly?: boolean;
};

export type SidebarGroupConfig = SidebarLeafConfig & {
  items: SidebarLeafConfig[];
};

export type SidebarEntryConfig = SidebarLeafConfig | SidebarGroupConfig;

// =============== CONFIG ===============

export const sidebarConfig: SidebarEntryConfig[] = [
  {
    label: { en: "Dashboard", ar: "الرئيسية" },
    href: "/dashboard",
    icon: Home,
    requiredPermission: PERMISSIONS.SHOW_ANALYTICS,
    items: [],
  },
  {
    label: { en: "Sales & Customers", ar: "المبيعات والعملاء" },
    href: "/sales",
    icon: BadgeDollarSign,
    items: [
      {
        label: { en: "Customers", ar: "العملاء" },
        href: "/sales/customers",
        icon: Users,
        requiredPermission: PERMISSIONS.LIST_CUSTOMERS,
      },
      {
        label: { en: "Inquiries", ar: "الاستفسارات" },
        href: "/sales/inquiries",
        icon: FileSearch,
        requiredPermission: PERMISSIONS.LIST_INQUIRIES,
      },
      {
        label: { en: "Previews (Site Visits)", ar: "المعاينات (الزيارات الميدانية)" },
        href: "/sales/previews",
        icon: ClipboardList,
        requiredPermission: PERMISSIONS.LIST_PREVIEWS,
      },
      {
        label: { en: "Offers / Quotations", ar: "عروض الأسعار" },
        href: "/sales/offers",
        icon: FileText,
        requiredPermission: PERMISSIONS.LIST_OFFERS,
      },
      {
        label: { en: "Contracts", ar: "العقود" },
        href: "/sales/contracts",
        icon: FileText,
        requiredPermission: PERMISSIONS.LIST_CONTRACTS,
      },
      {
        label: { en: "Receptions", ar: "التسلميات" },
        href: "/fulfillment/receptions",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.LIST_RECEPTIONS,
      },
    ],
  },
  {
    label: { en: "Products & Engineering", ar: "المنتجات والهندسة" },
    href: "/engineering",
    icon: Settings2,
    items: [
      {
        label: { en: "Product Catalog", ar: "كتالوج المنتجات" },
        href: "/engineering/products",
        icon: PackageSearch,
        requiredPermission: PERMISSIONS.LIST_PRODUCTS,
      },
      {
        label: { en: "BOMs / Material Recipes", ar: "قوائم المواد" },
        href: "/engineering/boms",
        icon: Boxes,
        requiredPermission: PERMISSIONS.LIST_BOMS,
      },
    ],
  },
  {
    label: { en: "Production", ar: "الإنتاج" },
    href: "/production",
    icon: Factory,
    items: [
      {
        label: { en: "Production Plans", ar: "خطط الإنتاج" },
        href: "/production/plans",
        icon: ClipboardList,
        requiredPermission: PERMISSIONS.LIST_PRODUCTION_PLANS,
      },
      {
        label: { en: "Routing", ar: "المسارات" },
        href: "/production/routing",
        icon: Route,
        requiredPermission: PERMISSIONS.LIST_PRODUCTION_ROUTING,
      },
    ],
  },
  {
    label: { en: "Warehouse", ar: "المخازن" },
    href: "/warehouse",
    icon: Boxes,
    items: [
      {
        label: { en: "Materials & Spare Parts", ar: "الخامات وقطع الغيار" },
        href: "/warehouse/materials",
        icon: PackageSearch,
        requiredPermission: PERMISSIONS.LIST_MATERIALS,
      },
      {
        label: { en: "Inventory Transations", ar: "حركات المخزون" },
        href: "/warehouse/transations",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.LIST_INVENTORY_TRANSACTIONS,
      },
    ],
  },
  {
    label: { en: "Procurement", ar: "المشتريات" },
    href: "/procurement",
    icon: ShoppingCart,
    items: [
      {
        label: { en: "Vendors", ar: "الموردون" },
        href: "/procurement/vendors",
        icon: HandCoins,
        requiredPermission: PERMISSIONS.LIST_VENDORS,
      },
      {
        label: { en: "Material Purchase Orders", ar: "أوامر شراء الخامات" },
        href: "/procurement/material-orders",
        icon: FileText,
        requiredPermission: PERMISSIONS.LIST_MATERIAL_PURCHASE_ORDERS,
      },
      {
        label: { en: "Product Purchase Orders", ar: "أوامر شراء المنتجات" },
        href: "/procurement/product-orders",
        icon: FileText,
        requiredPermission: PERMISSIONS.LIST_PRODUCT_PURCHASE_ORDERS,
      },
    ],
  },
  {
    label: { en: "Delivery & Installation", ar: "التسليم والتركيب" },
    href: "/fulfillment",
    icon: Truck,
    items: [
      {
        label: { en: "Trips", ar: "المأموريات" },
        href: "/fulfillment/trips",
        icon: Truck,
        requiredPermission: PERMISSIONS.LIST_TRIPS,
      },
      {
        label: { en: "Deliveries", ar: "النقل والتشوين" },
        href: "/fulfillment/deliveries",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.LIST_DELIVERIES,
      },
      {
        label: { en: "Installations", ar: "التركيبات" },
        href: "/fulfillment/installations",
        icon: Hammer,
        requiredPermission: PERMISSIONS.LIST_INSTALLATIONS,
      },
    ],
  },
  {
    label: { en: "Maintenance & Service", ar: "الصيانة والخدمة" },
    href: "/maintenance",
    icon: Wrench,
    items: [
      {
        label: { en: "Service Agreements", ar: "عقود الصيانة" },
        href: "/maintenance/agreements",
        icon: FileText,
        requiredPermission: PERMISSIONS.LIST_SERVICE_AGREEMENTS,
      },
      {
        label: { en: "Maintenance Orders", ar: "أوامر الصيانة" },
        href: "/maintenance/orders",
        icon: Wrench,
        requiredPermission: PERMISSIONS.LIST_MAINTENANCE_ORDERS,
      },
    ],
  },
  {
    label: { en: "Organization", ar: "المؤسسة" },
    href: "/organization",
    icon: Building2,
    adminOnly: true,
    items: [
      {
        label: { en: "Users", ar: "المستخدمون" },
        href: "/organization/users",
        icon: UserCog,
        requiredPermission: PERMISSIONS.LIST_USERS,
        adminOnly: true,
      },
      {
        label: { en: "Departments", ar: "الأقسام" },
        href: "/organization/departments",
        icon: Building2,
        requiredPermission: PERMISSIONS.LIST_DEPARTMENTS,
        adminOnly: true,
      },
    ],
  },
];

// =============== HELPERS ===============

export function isSidebarGroup(entry: SidebarEntryConfig): entry is SidebarGroupConfig {
  return "items" in entry;
}

export function canAccessEntry(entry: SidebarEntryConfig, user: UserState): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (entry.adminOnly) return false;
  if (isSidebarGroup(entry)) return entry.items.some((item) => canAccessEntry(item, user));
  if (entry.requiredPermission) return user.role.permissions.includes(entry.requiredPermission);
  return true;
}

export function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
