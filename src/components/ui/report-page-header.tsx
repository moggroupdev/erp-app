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
    <header className="flex flex-col gap-6">
      <Breadcrumbs items={breadcrumbs} sideElement={sideElement} />
      <TitleBlock icon={Icon} title={title} subtitle={subtitle} />
    </header>
  );
}

function Breadcrumbs({ items, sideElement }: { items: BreadcrumbItem[]; sideElement?: React.ReactNode | null }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-300 pb-4">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const label = translate(item.label.en, item.label.ar);
          const isLast = index === items.length - 1;

          return (
            <div key={`${item.label.en}-${index}`} className="flex items-center gap-2 text-xs">
              {item.href && !isLast ? (
                <Link href={getLocalizedHref(item.href)} className="text-gray-800/75 transition-colors hover:text-gray-800">
                  {label}
                </Link>
              ) : (
                <span className={isLast ? "text-gray-800" : "text-gray-800/75"}>{label}</span>
              )}

              {!isLast ? <span className="text-gray-800/35">/</span> : null}
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-300/75 text-gray-800">
        <Icon size={20} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800 sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-800/75 sm:text-[15px]">{subtitle}</p>
      </div>
    </div>
  );
}
