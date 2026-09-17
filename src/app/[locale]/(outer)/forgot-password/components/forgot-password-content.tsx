"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@mantine/core";
import { ArrowLeft, Headset, UserRound } from "lucide-react";
import { APP_NAME } from "@/lib/constants/global";
import { getLogoSize } from "@/lib/constants/ratios";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

export default function ForgotPasswordContent() {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <div className="animate-fade-in relative mx-auto w-full max-w-xl px-2">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-teal-50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-slate-100 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-8 h-36 w-36 rounded-full bg-teal-100/60 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/90 px-6 py-10 shadow-[0_20px_50px_-28px_rgba(17,94,89,0.35)] backdrop-blur-sm sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-teal-800" />
        <div className="pointer-events-none absolute -end-16 -top-20 h-44 w-44 rounded-full bg-teal-50/90" />
        <div className="pointer-events-none absolute -start-10 -bottom-24 h-48 w-48 rounded-full bg-slate-50" />

        <div className="relative flex flex-col items-center text-center">
          <Image src="/images/logo.png" alt={APP_NAME} {...getLogoSize(72)} className="rounded" style={{ height: "auto" }} />

          <div className="mt-7 flex h-18 w-18 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
            <Headset size={30} strokeWidth={1.5} />
          </div>

          <p className="mt-6 text-[11px] font-semibold tracking-[0.16em] text-teal-800 uppercase">
            {translate("Account recovery", "استعادة الحساب")}
          </p>

          <h1 className="mt-2 max-w-md text-balance">
            {translate("Contact your system administrator", "تواصل مع مسؤول النظام")}
          </h1>

          <p className="mt-4 max-w-md leading-relaxed text-pretty text-gray-600">
            {translate(
              "Password resets are handled by administrators to keep accounts secure. Reach out to your system administrator and they will restore your access.",
              "إعادة تعيين كلمات المرور تتم عبر المسؤولين لحماية الحسابات. تواصل مع مسؤول النظام وسيقوم باستعادة وصولك.",
            )}
          </p>

          <div className="mt-9 w-full max-w-sm">
            <Button component={Link} href={getLocalizedHref("/login")} color="teal" size="md" fullWidth>
              {translate("Return to login", "العودة إلى تسجيل الدخول")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
