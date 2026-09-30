"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { ADMIN_SIDEBAR_COLLAPSED_WIDTH, ADMIN_SIDEBAR_EXPANDED_WIDTH } from "@/lib/constants/global";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import Logo from "@/components/global/logo";
import SidebarBody from "./components/sidebar-body";

const iconButtonClassName =
  "flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800";

export default function InnerSidebar() {
  const { locale, translate, translation } = useI18n();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const sidebarWidth = collapsed ? ADMIN_SIDEBAR_COLLAPSED_WIDTH : ADMIN_SIDEBAR_EXPANDED_WIDTH;
  const drawerDir = localeDirections[locale];

  const toggleSidebar = () => setCollapsed((current) => !current);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleButtonClassName = collapsed
    ? "pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-800"
    : iconButtonClassName;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) closeDrawer();
    };

    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [closeDrawer]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
        <Logo title={translation.dashboard} />
        <button
          type="button"
          onClick={openDrawer}
          aria-expanded={drawerOpened}
          aria-controls="mobile-navigation-drawer"
          aria-label={translate("Open menu", "فتح القائمة")}
          className={iconButtonClassName}
        >
          <Menu size={20} />
        </button>
      </header>

      <Drawer.Root
        opened={drawerOpened}
        onClose={closeDrawer}
        position="left"
        transitionProps={{ transition: "slide-right" }}
        size={`min(100vw, ${ADMIN_SIDEBAR_EXPANDED_WIDTH}px)`}
        padding={0}
      >
        <Drawer.Overlay />
        <Drawer.Content
          id="mobile-navigation-drawer"
          dir="ltr"
          styles={{
            inner: { direction: "ltr", justifyContent: "flex-start" },
            content: {
              height: "100dvh",
              maxHeight: "100dvh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <div dir={drawerDir} className="flex min-h-0 flex-1 flex-col">
            <Drawer.Header style={{ padding: "1rem" }}>
              <Drawer.Title>
                <Logo title={translation.dashboard} />
              </Drawer.Title>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label={translate("Close menu", "إغلاق القائمة")}
                className={iconButtonClassName}
              >
                <X size={20} />
              </button>
            </Drawer.Header>

            <Drawer.Body
              className="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              style={{
                display: "flex",
                flex: "1 1 auto",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                padding: 0,
              }}
            >
              <hr className="border-gray-200" />
              <SidebarBody collapsed={false} onNavigate={closeDrawer} />
            </Drawer.Body>
          </div>
        </Drawer.Content>
      </Drawer.Root>

      <aside style={{ width: `${sidebarWidth}px` }} className="hidden shrink-0 lg:block">
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
    </>
  );
}
