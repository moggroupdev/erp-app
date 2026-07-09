"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Collapse, Menu } from "@mantine/core";
import { localeNames } from "@/lib/i18n/config";
import { useUser } from "@/contexts/user/hook";
import useLogout from "@/hooks/use-logout";
import { useI18n, useLocaleHref, useLocaleSwitch } from "@/lib/i18n/hooks";
import { ChevronDown, Globe, LogOut, UserCircle2 } from "lucide-react";

export default function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const { translate } = useI18n();
  const { nextLocale, switchLocale } = useLocaleSwitch();
  const getLocalizedHref = useLocaleHref();

  const { user } = useUser();
  const logout = useLogout();

  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="z-50 shrink-0 border-t border-gray-200 px-3 pt-2 pb-3">
      {collapsed ? (
        <Menu withArrow shadow="md" radius="lg" width={200} offset={14}>
          <Menu.Target>
            <button
              type="button"
              title={user.name}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200/75 text-gray-800 hover:bg-gray-200`}
            >
              <UserCircle2 size={20} />
            </button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
            </Menu.Label>

            <Menu.Divider />

            <Menu.Item type="button" color="dark" onClick={() => switchLocale()} leftSection={<Globe size={15} />}>
              {translate("Switch Language", "تغيير اللغة")}
            </Menu.Item>

            <Menu.Item
              component={Link}
              color="dark"
              href={getLocalizedHref("/profile")}
              leftSection={<UserCircle2 size={15} />}
            >
              {translate("Profile", "الملف الشخصي")}
            </Menu.Item>

            <Menu.Item
              color="red"
              type="button"
              leftSection={<LogOut size={15} className={translate("rotate-180", "")} />}
              onClick={async () => {
                await logout({ redirectToLogin: true, preserveRedirect: false });
              }}
            >
              {translate("Logout", "تسجيل الخروج")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-gray-800 transition-colors hover:bg-gray-200 ${isOpen ? "bg-gray-200/85" : ""}`}
          >
            <UserCircle2 size={20} className="mx-1" />

            <div className="flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">{user.name}</div>
              <div className="truncate text-xs text-gray-500">{user.code}</div>
            </div>

            <ChevronDown size={15} className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "" : "rotate-180"}`} />
          </button>

          <Collapse in={isOpen}>
            <div className="mt-2 flex flex-col gap-2 overflow-hidden rounded-xl bg-white">
              <Button
                title={localeNames[nextLocale]}
                type="button"
                variant="light"
                color="dark"
                radius="md"
                fullWidth
                justify="flex-start"
                leftSection={<Globe size={15} />}
                onClick={() => switchLocale(() => setIsOpen(false))}
              >
                {translate("Switch Language", "تغيير اللغة")}
              </Button>

              <Link href={getLocalizedHref("/profile")} onClick={() => setIsOpen(false)}>
                <Button
                  type="button"
                  variant="light"
                  color="dark"
                  radius="md"
                  fullWidth
                  justify="flex-start"
                  leftSection={<UserCircle2 size={15} />}
                >
                  {translate("Profile", "الملف الشخصي")}
                </Button>
              </Link>

              <Button
                type="button"
                variant="light"
                color="red"
                radius="md"
                fullWidth
                justify="flex-start"
                leftSection={<LogOut size={15} className={translate("rotate-180", "")} />}
                onClick={async () => {
                  setIsOpen(false);
                  await logout({ redirectToLogin: true, preserveRedirect: false });
                }}
              >
                {translate("Logout", "تسجيل الخروج")}
              </Button>
            </div>
          </Collapse>
        </>
      )}
    </div>
  );
}
