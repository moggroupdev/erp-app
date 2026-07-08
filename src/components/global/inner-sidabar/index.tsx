"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ADMIN_SIDEBAR_COLLAPSED_WIDTH, ADMIN_SIDEBAR_EXPANDED_WIDTH } from "@/lib/constants/global";
import { useI18n } from "@/lib/i18n/hooks";
import Logo from "@/components/global/logo";
import SidebarBody from "./components/sidebar-body";

export default function InnerSidebar() {
  const { translate, translation } = useI18n();

  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? ADMIN_SIDEBAR_COLLAPSED_WIDTH : ADMIN_SIDEBAR_EXPANDED_WIDTH;

  const toggleSidebar = () => setCollapsed((current) => !current);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleButtonClassName = collapsed
    ? "pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-800"
    : "flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800";

  return (
    <aside style={{ width: `${sidebarWidth}px` }} className="shrink-0">
      <div style={{ width: `${sidebarWidth}px` }} className="fixed z-40 flex h-screen flex-col bg-white">
        <header
          className={`group flex items-center ${collapsed ? "relative justify-center px-3 py-4" : "justify-between gap-3 px-4 py-4"}`}
        >
          <div
            className={
              collapsed
                ? "relative flex items-center justify-center group-focus-within:opacity-0 group-hover:opacity-0"
                : "flex items-center"
            }
          >
            <Logo title={collapsed ? undefined : translation.dashboard} />
          </div>
          <button type="button" onClick={toggleSidebar} className={toggleButtonClassName}>
            <ToggleIcon size={20} className={translate("rotate-0", "rotate-180")} />
          </button>
        </header>

        <hr className="border-gray-200" />

        <div className="flex min-h-0 flex-1 flex-col">
          <SidebarBody collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
