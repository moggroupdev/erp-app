"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
  titleAside?: ReactNode;
  deletedAt?: number | string | Date | null;
  rows: DetailRow[];
  children?: ReactNode;
  className?: string;
};

export default function EntityDetails({
  title,
  titleAside,
  deletedAt,
  rows,
  children,
  className,
}: EntityDetailsProps) {
  const { locale, translate } = useI18n();
  const isDeleted = !!deletedAt;

  return (
    <section className={`flex flex-col gap-4 ${className ?? "rounded-xl"}`}>
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <div className="flex flex-wrap items-center gap-3">
          {typeof title === "string" || typeof title === "number" ? (
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
          ) : (
            title
          )}
          {titleAside}
        </div>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(deletedAt, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />

      {children}
    </section>
  );
}
