"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { Factory, Package, ShoppingCart, Workflow } from "lucide-react";
import Logo from "@/components/global/logo";
import useUser from "@/contexts/user/hook";
import { DEFAULT_HOME_HREF } from "@/lib/constants/global";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

export default function HomeContent() {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { isInitializing, user } = useUser();

  const ctaHref = getLocalizedHref(user ? DEFAULT_HOME_HREF : "/login");
  const ctaLabel = user ? translation.dashboard : translate("Sign in to your account", "تسجيل الدخول إلى حسابك");

  return (
    <div className="root-flex-1 flex flex-col">
      <section className="flex flex-1 flex-col items-center justify-center bg-linear-to-b from-gray-50 to-white px-4 py-16 text-center">
        <Logo />

        <h1 className="mt-8 max-w-2xl text-balance">
          {translate("Complete Business Management Platform", "منصة متكاملة لإدارة الأعمال")}
        </h1>

        <p className="mt-4 max-w-5xl leading-relaxed text-balance">{translation.appDescription}</p>

        <div className="mt-8">
          {isInitializing ? null : (
            <Link href={ctaHref}>
              <Button size="lg" radius="md">
                {ctaLabel}
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
