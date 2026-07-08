"use client";

import { useRouter } from "next/navigation";
import { useI18n, useLocale, useLocaleHref, useLocaleSwitch } from "@/lib/i18n/hooks";
import { getTranslation } from "@/lib/i18n/utils";
import { localeNames } from "@/lib/i18n/config";
import {
  Armchair,
  ArrowUpCircle,
  BarChart3,
  Box,
  Building2,
  Coins,
  CreditCard,
  FileText,
  Globe,
  Handshake,
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
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const router = useRouter();
  const { nextLocale, switchLocale } = useLocaleSwitch();

  const links: Link[] = [
    {
      href: getLocalizedHref("/dashboard"),
      label: translate("Dashboard", "الرئيسية"),
      Icon: <BarChart3 size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/organization/departments"),
      label: translate("Departments", "القسام"),
      Icon: <Building2 size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/engineering/products"),
      label: translate("Products", "المنتجات"),
      Icon: <Box size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/sales/customers"),
      label: translate("Customers", "العملاء"),
      Icon: <Users size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/procurement/vendors"),
      label: translate("Vendors", "الموردين"),
      Icon: <Handshake size={ICON_SIZE} />,
    },
    {
      href: getLocalizedHref("/organization/users"),
      label: translate("Users", "المستخدمين"),
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
