"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@mantine/core";
import { Globe } from "lucide-react";
import useUser from "@/contexts/user/hook";
import { DEFAULT_HOME_HREF } from "@/lib/constants/global";
import { useI18n, useLocaleHref, useLocaleSwitch } from "@/lib/i18n/hooks";
import { localeNames } from "@/lib/i18n/config";
import { getPathnameWithoutLocale } from "@/lib/i18n/utils";

const publicLinks = [
  { href: "/", en: "Home", ar: "الصفحة الرئيسية" },
  { href: "/login", en: "Sign in", ar: "تسجيل الدخول" },
  { href: "/contact-us", en: "Contact Us", ar: "تواصل معنا" },
  { href: "/privacy-policy", en: "Privacy Policy", ar: "سياسة الخصوصية" },
  { href: "/terms-and-conditions", en: "Terms & Conditions", ar: "الشروط والأحكام" },
] as const;

function isLinkActive(path: string, currentPath: string) {
  if (path === "/") return currentPath === "/";
  if (path === DEFAULT_HOME_HREF) {
    return currentPath === DEFAULT_HOME_HREF || currentPath.startsWith(`${DEFAULT_HOME_HREF}/`);
  }
  return currentPath === path;
}

export default function PublicFooter() {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const pathname = usePathname();
  const currentPath = getPathnameWithoutLocale(pathname);
  const { nextLocale, switchLocale } = useLocaleSwitch();
  const { user } = useUser();

  const navLinks = publicLinks.map((link) => {
    if (link.href !== "/login") return link;
    if (user) return { href: user.role?.homeUrl || DEFAULT_HOME_HREF, en: "Dashboard", ar: "لوحة التحكم" };
    return link;
  });

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href, currentPath);
            return (
              <Link
                key={link.href}
                href={getLocalizedHref(link.href)}
                className={`text-xs transition-colors sm:text-sm ${
                  isActive ? "text-gray-800" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {translate(link.en, link.ar)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="light"
            color="dark"
            size="sm"
            radius="md"
            leftSection={<Globe size={14} />}
            onClick={() => switchLocale()}
          >
            {localeNames[nextLocale]}
          </Button>
          <p className="text-xs text-gray-400 sm:text-sm">
            © {new Date().getFullYear()} {translation.appName}
          </p>
        </div>
      </div>
    </footer>
  );
}
