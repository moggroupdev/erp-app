"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/contexts/user/hook";
import { getPathnameWithoutLocale } from "@/lib/i18n/utils";
import { canAccessEntry, isPathActive, isSidebarGroup, sidebarConfig } from "./config";
import SidebarGroup from "./sidebar-group";
import SidebarItem from "./sidebar-item";
import SidebarUserMenu from "./sidebar-user-menu";

export default function SidebarBody({ collapsed }: { collapsed: boolean }) {
  const pathname = getPathnameWithoutLocale(usePathname());
  const { user, isInitializing } = useUser();

  const visibleEntries = useMemo(() => {
    if (isInitializing || !user) return [];
    return sidebarConfig
      .filter((entry) => canAccessEntry(entry, user))
      .map((entry) => {
        if (!isSidebarGroup(entry)) return entry;
        return { ...entry, items: entry.items.filter((item) => canAccessEntry(item, user)) };
      });
  }, [isInitializing, user]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedGroups((current) => {
      const next = { ...current };
      for (const entry of visibleEntries)
        if (isSidebarGroup(entry) && entry.items.some((item) => isPathActive(pathname, item.href))) next[entry.href] = true;
      return next;
    });
  }, [pathname, visibleEntries]);

  if (isInitializing) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <div className="flex flex-col gap-2">
          {visibleEntries.map((entry) => {
            if (!isSidebarGroup(entry)) {
              return (
                <SidebarItem
                  key={entry.href}
                  label={entry.label}
                  href={entry.href}
                  icon={entry.icon}
                  collapsed={collapsed}
                  isActive={isPathActive(pathname, entry.href)}
                />
              );
            }

            const isActive = pathname === entry.href || entry.items.some((item) => isPathActive(pathname, item.href));
            const activeChild = entry.items.find((item) => isPathActive(pathname, item.href));
            const expanded = collapsed ? false : (expandedGroups[entry.href] ?? isActive);

            return (
              <SidebarGroup
                key={entry.href}
                group={entry}
                collapsed={collapsed}
                expanded={expanded}
                isActive={isActive}
                activeChildHref={activeChild?.href}
                onToggle={() =>
                  setExpandedGroups((current) => ({ ...current, [entry.href]: !(current[entry.href] ?? isActive) }))
                }
              />
            );
          })}
        </div>
      </nav>

      <SidebarUserMenu collapsed={collapsed} />
    </div>
  );
}
