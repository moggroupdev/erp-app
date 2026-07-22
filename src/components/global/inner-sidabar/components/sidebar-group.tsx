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
  const hasChildren = group.items.length > 0;

  const className = [
    "group flex w-full items-center rounded-lg px-2.5 py-2 text-sm! font-semibold! transition-colors",
    collapsed ? "justify-center px-2" : "gap-2.5",
    isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100",
  ].join(" ");

  const content = (
    <>
      <group.icon size={18} className="shrink-0" />

      {!collapsed && (
        <>
          <span className="flex-1 truncate text-start">{localizedLabel}</span>
          {hasChildren && (
            <ChevronDown size={14} className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
          )}
        </>
      )}
    </>
  );

  const handleParentClick = () => {
    if (hasChildren) onToggle();
  };

  return (
    <div className="flex flex-col gap-1">
      {group.href ? (
        <Link
          title={collapsed ? localizedLabel : undefined}
          href={getLocalizedHref(group.href)}
          onClick={handleParentClick}
          className={className}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          title={collapsed ? localizedLabel : undefined}
          onClick={handleParentClick}
          disabled={!hasChildren}
          className={className}
        >
          {content}
        </button>
      )}

      {!collapsed && hasChildren && expanded && (
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
