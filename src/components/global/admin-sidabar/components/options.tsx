"use client";

import { useRouter } from "next/navigation";
import { useLocale, useLocaleHref, useLocaleSwitch } from "@/lib/i18n/hooks";
import { getTranslation } from "@/lib/i18n/utils";
import { localeNames } from "@/lib/i18n/config";
import {
  Armchair,
  ArrowUpCircle,
  BarChart3,
  Coins,
  CreditCard,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  Monitor,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import AdminButton from "./button";
import AdminNavLink from "./nav-link";

const ICON_SIZE = 22.675;

export type Link = { href: string; label: string; Icon?: React.ReactNode; nestedLinks?: Link[] };

export default function AdminSidebarOptions({ closeDrawer }: { closeDrawer?: () => void }) {
  const locale = useLocale();
  const translation = getTranslation(locale);
  const getLocalizedHref = useLocaleHref();

  const router = useRouter();
  const { nextLocale, switchLocale } = useLocaleSwitch();

  const links: Link[] = [
    {
      href: getLocalizedHref("/dashboard/home"),
      label: translation.pages.home,
      Icon: <Home size={ICON_SIZE} />,
      nestedLinks: [
        {
          href: getLocalizedHref("/dashboard/home/vendors"),
          label: translation.pages.vendors,
        },
        {
          href: getLocalizedHref("/dashboard/home/purchase-orders"),
          label: translation.pages.purchaseOrders,
        },
        {
          href: getLocalizedHref("/dashboard/home/products"),
          label: translation.pages.products,
        },
        {
          href: getLocalizedHref("/dashboard/home/sales-orders"),
          label: translation.pages.salesOrders,
        },
        {
          href: getLocalizedHref("/dashboard/home/customers"),
          label: translation.pages.customers,
        },
        {
          href: getLocalizedHref("/dashboard/home/expenses"),
          label: translation.pages.expenses,
        },
        {
          href: getLocalizedHref("/dashboard/home/transfers"),
          label: translation.pages.transfers,
        },
        {
          href: getLocalizedHref("/dashboard/home/departments"),
          label: translation.pages.departments,
        },
      ],
    },
    {
      href: getLocalizedHref("/dashboard/analytics"),
      label: translation.pages.analytics,
      Icon: <BarChart3 size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/reports"),
      label: translation.pages.reports,
      Icon: <FileText size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/payments"),
      label: translation.pages.payments,
      Icon: <CreditCard size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/currencies"),
      label: translation.pages.currencies,
      Icon: <Coins size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/coupons"),
      label: translation.pages.coupons,
      Icon: <Ticket size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/categories"),
      label: translation.pages.categories,
      Icon: <LayoutGrid size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/customization"),
      label: translation.pages.customization,
      Icon: <Monitor size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/shipping"),
      label: translation.pages.shipping,
      Icon: <Truck size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/fixed-assets"),
      label: translation.pages.fixedAssets,
      Icon: <Armchair size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/dashboard/users"),
      label: translation.pages.users,
      Icon: <Users size={ICON_SIZE} />,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between gap-2">
      <nav className="flex flex-1 flex-col py-2">
        {links.map((link) => (
          <AdminNavLink key={link.href} link={link} onClick={closeDrawer} />
        ))}
      </nav>

      <footer className="flex flex-col gap-1 py-2">
        <AdminButton
          Icon={<Globe size={ICON_SIZE} />}
          label={localeNames[nextLocale]}
          onClick={() => switchLocale(closeDrawer)}
        />
        <hr className="border-gray-200" />
        <AdminButton
          Icon={<ArrowUpCircle size={ICON_SIZE} />}
          label={translation.back}
          onClick={() => {
            closeDrawer?.();
            router.push("/");
          }}
        />
      </footer>
    </div>
  );
}
