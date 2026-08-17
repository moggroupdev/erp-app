"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import useUser from "@/contexts/user/hook";
import { DEFAULT_HOME_HREF } from "@/lib/constants/global";
import { getLogoSize } from "@/lib/constants/ratios";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import Image from "next/image";

export default function HomeContent() {
  const { translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { isInitializing, user } = useUser();

  const ctaHref = getLocalizedHref(user ? user.role?.homeUrl || DEFAULT_HOME_HREF : "/login");
  const ctaLabel = user ? translation.dashboard : translate("Sign in to your account", "تسجيل الدخول إلى حسابك");

  return (
    <div className="root-flex-1 flex flex-col">
      <section className="flex flex-1 flex-col items-center justify-center bg-linear-to-b from-gray-50 to-white px-4 py-16 text-center">
        <Image
          src={"/images/logo.png"}
          alt="logo"
          {...getLogoSize(150)}
          className="rounded"
          style={{ height: "auto" }}
        />

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
