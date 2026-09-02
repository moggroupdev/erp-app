"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Ban, type LucideIcon } from "lucide-react";
import { Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";

export type DetailRow = {
  key: string;
  value: ReactNode;
  mono?: boolean;
  copyText?: string;
};

export function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

export function CreatorLink({ creator }: { creator: { id: string; name: string } | null | undefined }) {
  const getLocalizedHref = useLocaleHref();

  if (!creator) return <EmptyValue />;

  return (
    <Link href={getLocalizedHref(`/organization/users/${creator.id}`)} className="hover:underline">
      {creator.name}
    </Link>
  );
}

export function DetailsTable({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-gray-100 p-2">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.key}>
              <Table.Th w="30%" className="text-gray-600">
                {row.key}
              </Table.Th>
              <Table.Td className="font-medium text-gray-900">
                <div className={`flex items-center gap-1.5 ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                  {row.copyText && <CopyButton text={row.copyText} />}
                </div>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

type EntityDetailsProps = {
  title: ReactNode;
  icon?: LucideIcon;
  titleAside?: ReactNode;
  deletedAt?: number | string | Date | null;
  inactiveLabel?: string;
  rows: DetailRow[];
  children?: ReactNode;
  className?: string;
};

export default function EntityDetails({
  title,
  icon: Icon,
  titleAside,
  deletedAt,
  inactiveLabel,
  rows,
  children,
  className,
}: EntityDetailsProps) {
  const { locale, translate } = useI18n();
  const isDeleted = !!deletedAt;
  const titleText = typeof title === "string" || typeof title === "number" ? String(title) : null;

  return (
    <section className={`flex flex-col gap-4 ${className ?? "rounded-xl"}`}>
      <Divider variant="dashed" />

      <header
        className={`relative overflow-hidden border border-gray-200/80 bg-linear-to-br from-slate-50 via-white to-teal-50/30 p-5 sm:p-6 ${translate("rounded-r-3xl", "rounded-l-3xl")}`}
      >
        <div className={`pointer-events-none absolute inset-y-0 start-0 w-1 ${isDeleted ? "bg-red-500" : "bg-teal-500"}`} />

        <div className="flex flex-col gap-4 ps-2 sm:flex-row sm:items-center sm:justify-between sm:ps-3">
          <div className="flex items-center gap-4">
            {Icon && (
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
                  isDeleted ? "bg-red-50 text-red-500 ring-1 ring-red-100" : "bg-teal-100 text-teal-600 ring-1 ring-teal-100"
                }`}
              >
                {isDeleted ? <Ban size={21} /> : <Icon size={24} strokeWidth={1.75} />}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                {titleText ? (
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">{titleText}</h2>
                ) : (
                  title
                )}
                {titleAside}
              </div>

              {isDeleted && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 ring-inset">
                    {inactiveLabel ?? translate("Deleted", "محذوف")}
                  </span>
                  <span className="text-sm text-red-500/80">{formatDateAndTime(deletedAt, locale)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />

      {children}
    </section>
  );
}
