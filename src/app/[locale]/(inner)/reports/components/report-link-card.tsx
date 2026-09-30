"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

export default function ReportLinkCard({
  report,
}: {
  report: { label: { en: string; ar: string }; description: { en: string; ar: string }; href: string };
}) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <Link
      href={getLocalizedHref(report.href)}
      className="group flex items-start gap-4 rounded-2xl bg-white p-5 transition-colors"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="group-hover:text-haze-800 text-xs font-semibold text-gray-800 sm:text-sm">
          {translate(report.label.en, report.label.ar)}
        </span>
        <span className="text-xs leading-[1.75] text-gray-500">
          {translate(report.description.en, report.description.ar)}
        </span>
      </div>

      <ChevronRight
        size={18}
        className={`group-hover:text-haze-600 mt-0.5 shrink-0 text-gray-400 transition-colors ${translate("", "rotate-180")}`}
      />
    </Link>
  );
}
