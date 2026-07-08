"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/hooks";
import { useLocaleHref } from "@/lib/i18n/hooks";
import type { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  label: { en: string; ar: string };
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  collapsed?: boolean;
  nested?: boolean;
  onClick?: () => void;
};

export default function SidebarItem({ label, href, icon: Icon, isActive, collapsed = false, onClick }: SidebarItemProps) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const localizedLabel = translate(label.en, label.ar);

  return (
    <Link
      title={collapsed ? localizedLabel : undefined}
      href={getLocalizedHref(href)}
      onClick={onClick}
      className={[
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.75px] font-medium transition-colors",
        collapsed ? "justify-center px-2" : "",
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && <span className="truncate">{localizedLabel}</span>}
    </Link>
  );
}
