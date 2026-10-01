"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/hooks";
import { useLocaleHref } from "@/lib/i18n/hooks";
import { sidebarNavTheme } from "@/lib/constants/color-palette";
import type { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  label: { en: string; ar: string };
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  collapsed?: boolean;
  compact?: boolean;
  nested?: boolean;
  onClick?: () => void;
};

export default function SidebarItem({
  label,
  href,
  icon: Icon,
  isActive,
  collapsed = false,
  compact = false,
  onClick,
}: SidebarItemProps) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const localizedLabel = translate(label.en, label.ar);

  return (
    <Link
      title={collapsed ? localizedLabel : undefined}
      href={getLocalizedHref(href)}
      onClick={onClick}
      className={[
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-colors",
        compact ? "text-xs" : "text-[12.75px]",
        collapsed ? "justify-center px-2" : "",
        isActive ? sidebarNavTheme.itemActive : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      <Icon size={compact ? 13 : 15} className="shrink-0" />
      {!collapsed && <span className="truncate">{localizedLabel}</span>}
    </Link>
  );
}
