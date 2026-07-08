"use client";

import Link from "next/link";
import useUser from "@/contexts/user/hook";
import useLogout from "@/hooks/use-logout";
import { Button, Tooltip } from "@mantine/core";
import { localeNames } from "@/lib/i18n/config";
import { useI18n, useLocaleHref, useLocaleSwitch } from "@/lib/i18n/hooks";

export default function Header({ height }: { height: number }) {
  const { translate, translation } = useI18n();
  const { nextLocale, switchLocale } = useLocaleSwitch();
  const getLocalizedHref = useLocaleHref();

  const { user } = useUser();

  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 flex bg-white shadow" style={{ height: `${height}px` }}>
      <div className="relative container mx-auto flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Link href={getLocalizedHref("")} className="text-xl font-bold text-gray-800 hover:text-gray-600">
            {translation.appName}
          </Link>
          <Tooltip label={translate("Switch Language", "تغيير اللغة")} withArrow>
            <Button variant="subtle" color="dark" px="xs" onClick={() => switchLocale()}>
              {localeNames[nextLocale]}
            </Button>
          </Tooltip>
        </div>

        <nav className="relative hidden items-center justify-end font-semibold md:flex">
          <HeaderTooltipButton href={getLocalizedHref("/contact-us")} label={translate("Contact Us", "اتصل بنا")}>
            {translate("Contact Us", "اتصل بنا")}
          </HeaderTooltipButton>

          {user ? (
            <>
              {
                <HeaderTooltipButton
                  href={getLocalizedHref("/dashboard/home")}
                  label={translate("Dashboard", "لوحة التحكم")}
                >
                  {translate("Dashboard", "لوحة التحكم")}
                </HeaderTooltipButton>
              }
              <HeaderTooltipButton href={getLocalizedHref("/profile")} label={translate("Profile", "الملف الشخصي")}>
                {translate("Profile", "الملف الشخصي")}
              </HeaderTooltipButton>
              <HeaderTooltipButton
                onClick={() => logout({ redirectToLogin: true })}
                label={translate("Logout", "تسجيل الخروج")}
              >
                {translate("Logout", "تسجيل الخروج")}
              </HeaderTooltipButton>
            </>
          ) : (
            <>
              <HeaderTooltipButton href={getLocalizedHref("/login")} label={translate("Login", "تسجيل الدخول")}>
                {translate("Login", "تسجيل الدخول")}
              </HeaderTooltipButton>
              <HeaderTooltipButton href={getLocalizedHref("/register")} label={translate("Register", "التسجيل")}>
                {translate("Register", "التسجيل")}
              </HeaderTooltipButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// =============================================================

function HeaderTooltipButton({
  label,
  href,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Tooltip withArrow label={label} openDelay={100} offset={12} transitionProps={{ transition: "fade", duration: 250 }}>
      {href ? (
        <Link href={href} onClick={onClick}>
          <div className="relative">
            <Button variant="subtle" color="dark" px="xs">
              {children}
            </Button>
          </div>
        </Link>
      ) : (
        <Button onClick={onClick} variant="subtle" color="dark" px="xs">
          {children}
        </Button>
      )}
    </Tooltip>
  );
}
