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
      className="group flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/30"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-semibold text-stone-800 group-hover:text-teal-800">
          {translate(report.label.en, report.label.ar)}
        </span>
        <span className="text-xs leading-relaxed text-stone-500">
          {translate(report.description.en, report.description.ar)}
        </span>
      </div>
      <ChevronRight
        size={18}
        className={`mt-0.5 shrink-0 text-stone-400 transition-colors group-hover:text-teal-600 ${translate("", "rotate-180")}`}
      />
    </Link>
  );
}
