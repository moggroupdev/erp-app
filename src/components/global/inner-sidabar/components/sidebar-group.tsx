"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { SidebarGroupConfig } from "./config";
import SidebarItem from "./sidebar-item";

type SidebarGroupProps = {
  group: SidebarGroupConfig;
  collapsed: boolean;
  expanded: boolean;
  isActive: boolean;
  activeChildHref?: string;
  onToggle: () => void;
  onLeafClick?: () => void;
};

export default function SidebarGroup({
  group,
  collapsed,
  expanded,
  isActive,
  activeChildHref,
  onToggle,
  onLeafClick,
}: SidebarGroupProps) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const localizedLabel = translate(group.label.en, group.label.ar);

  return (
    <div className="flex flex-col gap-1">
      <Link
        title={collapsed ? localizedLabel : undefined}
        href={getLocalizedHref(group.href)}
        onClick={onToggle}
        className={[
          "group flex items-center rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
          collapsed ? "justify-center px-2" : "gap-2.5",
          isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100",
        ].join(" ")}
      >
        <group.icon size={18} className="shrink-0" />

        {!collapsed && (
          <>
            <span className="flex-1 truncate">{localizedLabel}</span>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </>
        )}
      </Link>

      {!collapsed && expanded && (
        <div className="ms-4.5 flex flex-col gap-1 border-s border-gray-200 ps-2">
          {group.items.map((item) => (
            <SidebarItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isActive={activeChildHref === item.href}
              onClick={onLeafClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
