import type { LucideIcon } from "lucide-react";
import { UserState } from "@/types/user";
import { PERMISSIONS, type Permission } from "@/lib/constants/enums/permissions";
import {
  BadgeDollarSign,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  Factory,
  FileSearch,
  FileText,
  HandCoins,
  Hammer,
  History,
  Home,
  PackageSearch,
  ReceiptText,
  Shield,
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
};

export type SidebarGroupConfig = {
  label: { en: string; ar: string };
  href?: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
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
    label: { en: "Reports", ar: "التقارير" },
    href: "/reports",
    icon: ChartNoAxesCombined,
    items: [
      {
        label: { en: "Materials", ar: "المواد" },
        href: "/reports/materials",
        icon: Boxes,
        requiredPermission: PERMISSIONS.READ_MATERIAL_REPORTS,
      },
      {
        label: { en: "Purchasing Materials", ar: "شراء المواد" },
        href: "/reports/purchasing-materials",
        icon: ShoppingCart,
        requiredPermission: PERMISSIONS.READ_MATERIAL_PURCHASING_REPORTS,
      },
    ],
  },
  {
    label: { en: "Sales & Customers", ar: "المبيعات والعملاء" },
    icon: BadgeDollarSign,
    items: [
      {
        label: { en: "Customers", ar: "العملاء" },
        href: "/sales/customers",
        icon: Users,
        requiredPermission: PERMISSIONS.READ_CUSTOMERS,
      },
      {
        label: { en: "Inquiries", ar: "الاستفسارات" },
        href: "/sales/inquiries",
        icon: FileSearch,
        requiredPermission: PERMISSIONS.READ_INQUIRIES,
      },
      {
        label: { en: "Previews (Site Visits)", ar: "المعاينات (الزيارات الميدانية)" },
        href: "/sales/previews",
        icon: ClipboardList,
        requiredPermission: PERMISSIONS.READ_PREVIEWS,
      },
      {
        label: { en: "Offers / Quotations", ar: "عروض الأسعار" },
        href: "/sales/offers",
        icon: FileText,
        requiredPermission: PERMISSIONS.READ_OFFERS,
      },
      {
        label: { en: "Contracts", ar: "العقود" },
        href: "/sales/contracts",
        icon: FileText,
        requiredPermission: PERMISSIONS.READ_CONTRACTS,
      },
      {
        label: { en: "Receptions", ar: "التسلميات" },
        href: "/fulfillment/receptions",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.READ_RECEPTIONS,
      },
      {
        label: { en: "Complaints", ar: "الشكاوي" },
        href: "/sales/complaints",
        icon: FileSearch,
        requiredPermission: PERMISSIONS.READ_COMPLAINTS,
      },
    ],
  },
  {
    label: { en: "Product Catalog", ar: "كتالوج المنتجات" },
    href: "/products",
    icon: PackageSearch,
    items: [],
  },
  {
    label: { en: "Production Plans", ar: "خطط الإنتاج" },
    href: "/production/plans",
    icon: Factory,
    items: [],
  },
  {
    label: { en: "Warehouse", ar: "المخازن" },
    icon: Boxes,
    items: [
      {
        label: { en: "Materials List", ar: "قائمة المواد" },
        href: "/warehouse/materials",
        icon: PackageSearch,
        requiredPermission: PERMISSIONS.READ_MATERIALS,
      },
      {
        label: { en: "Inventory Transactions", ar: "حركات المخزون" },
        href: "/warehouse/transactions",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.READ_INVENTORY_TRANSACTIONS,
      },
      {
        label: { en: "Legacy Issue Permits", ar: "أذونات الصرف المرحلية" },
        href: "/warehouse/legacy-issue-permits",
        icon: History,
        requiredPermission: PERMISSIONS.READ_LEGACY_ISSUE_PERMITS,
      },
    ],
  },
  {
    label: { en: "Procurement", ar: "المشتريات" },
    icon: ShoppingCart,
    items: [
      {
        label: { en: "Suppliers", ar: "الموردون" },
        href: "/procurement/suppliers",
        icon: HandCoins,
        requiredPermission: PERMISSIONS.READ_SUPPLIERS,
      },
      {
        label: { en: "Material Purchase Orders", ar: "أوامر شراء الخامات" },
        href: "/procurement/material-orders",
        icon: FileText,
        requiredPermission: PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS,
      },
      {
        label: { en: "Product Purchase Orders", ar: "أوامر شراء المنتجات" },
        href: "/procurement/product-orders",
        icon: FileText,
        requiredPermission: PERMISSIONS.READ_PRODUCT_PURCHASE_ORDERS,
      },
    ],
  },
  {
    label: { en: "Delivery & Installation", ar: "التسليم والتركيب" },
    icon: Truck,
    items: [
      {
        label: { en: "Trips", ar: "المأموريات" },
        href: "/fulfillment/trips",
        icon: Truck,
        requiredPermission: PERMISSIONS.READ_TRIPS,
      },
      {
        label: { en: "Deliveries", ar: "النقل والتشوين" },
        href: "/fulfillment/deliveries",
        icon: ReceiptText,
        requiredPermission: PERMISSIONS.READ_DELIVERIES,
      },
      {
        label: { en: "Installations", ar: "التركيبات" },
        href: "/fulfillment/installations",
        icon: Hammer,
        requiredPermission: PERMISSIONS.READ_INSTALLATIONS,
      },
    ],
  },
  {
    label: { en: "Maintenance & Service", ar: "الصيانة والخدمة" },
    icon: Wrench,
    items: [
      {
        label: { en: "Service Agreements", ar: "عقود الصيانة" },
        href: "/maintenance/agreements",
        icon: FileText,
        requiredPermission: PERMISSIONS.READ_SERVICE_AGREEMENTS,
      },
      {
        label: { en: "Maintenance Orders", ar: "أوامر الصيانة" },
        href: "/maintenance/orders",
        icon: Wrench,
        requiredPermission: PERMISSIONS.READ_MAINTENANCE_ORDERS,
      },
    ],
  },
  {
    label: { en: "Organization", ar: "المؤسسة" },
    icon: Building2,
    items: [
      {
        label: { en: "Users", ar: "المستخدمون" },
        href: "/organization/users",
        icon: UserCog,
        requiredPermission: PERMISSIONS.READ_USERS,
      },
      {
        label: { en: "Roles", ar: "الأدوار" },
        href: "/organization/roles",
        icon: Shield,
        requiredPermission: PERMISSIONS.READ_ROLES,
      },
      {
        label: { en: "Departments", ar: "الأقسام" },
        href: "/organization/departments",
        icon: Building2,
        requiredPermission: PERMISSIONS.READ_DEPARTMENTS,
      },
    ],
  },
];

// =============== HELPERS ===============

export function isSidebarGroup(entry: SidebarEntryConfig): entry is SidebarGroupConfig {
  return "items" in entry;
}

export function getSidebarEntryKey(entry: SidebarEntryConfig): string {
  if (isSidebarGroup(entry)) return entry.href ?? entry.label.en;
  return entry.href;
}

export function canAccessEntry(entry: SidebarEntryConfig, user: UserState): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (isSidebarGroup(entry)) return entry.items.some((item) => canAccessEntry(item, user));
  if (entry.requiredPermission) return user.role.permissions.includes(entry.requiredPermission);
  return true;
}

export function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
