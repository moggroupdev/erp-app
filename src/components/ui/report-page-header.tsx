"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

type BreadcrumbItem = {
  label: { en: string; ar: string };
  href?: string;
};

export default function ReportPageHeader({
  breadcrumbs,
  icon: Icon,
  title,
  subtitle,
  sideElement,
}: {
  breadcrumbs: BreadcrumbItem[];
  icon: LucideIcon;
  title: string;
  subtitle: string;
  sideElement?: React.ReactNode;
}) {
  return (
    <header className="-mx-6 -mt-6 bg-linear-to-br from-slate-800 via-slate-800 to-teal-900 px-6 py-8 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-6 px-6 sm:px-8">
          <Breadcrumbs items={breadcrumbs} sideElement={sideElement} />
          <TitleBlock icon={Icon} title={title} subtitle={subtitle} />
        </div>
      </div>
    </header>
  );
}

function Breadcrumbs({ items, sideElement }: { items: BreadcrumbItem[]; sideElement?: React.ReactNode | null }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-600 pb-4">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const label = translate(item.label.en, item.label.ar);
          const isLast = index === items.length - 1;

          return (
            <div key={`${item.label.en}-${index}`} className="flex items-center gap-2 text-xs">
              {item.href && !isLast ? (
                <Link href={getLocalizedHref(item.href)} className="text-white/75 transition-colors hover:text-white">
                  {label}
                </Link>
              ) : (
                <span className={isLast ? "text-white" : "text-white/75"}>{label}</span>
              )}

              {!isLast ? <span className="text-white/35">/</span> : null}
            </div>
          );
        })}
      </nav>

      {sideElement}
    </div>
  );
}

function TitleBlock({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
        <Icon size={21} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/75 sm:text-[15px]">{subtitle}</p>
      </div>
    </div>
  );
}
