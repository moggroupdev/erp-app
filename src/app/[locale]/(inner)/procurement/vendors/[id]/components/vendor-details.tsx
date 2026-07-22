import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type VendorWithCreator } from "@/types/vendor";
import { Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";
import Link from "next/link";

type DetailRow = {
  key: string;
  value: React.ReactNode;
  mono?: boolean;
  copyText?: string;
};

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function DetailsTable({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-gray-100 p-2">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.key}>
              <Table.Th w="30%" className="text-gray-600">
                {row.key}
              </Table.Th>
              <Table.Td className={`font-medium text-gray-900`}>
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

export default function VendorDetails({ vendor }: { vendor: VendorWithCreator }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const isDeleted = !!vendor.deletedAt;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: vendor.code, mono: true, copyText: vendor.code },
    {
      key: translate("Phone", "الهاتف"),
      value: vendor.phone ? <a href={`tel:${vendor.phone}`}>{vendor.phone}</a> : <EmptyValue />,
    },
    {
      key: translate("Email", "البريد الإلكتروني"),
      value: vendor.email ? <a href={`mailto:${vendor.email}`}>{vendor.email}</a> : <EmptyValue />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: vendor.notes ? <span className="font-normal whitespace-pre-wrap">{vendor.notes}</span> : <EmptyValue />,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: (
        <Link href={getLocalizedHref(`/organization/users/${vendor.createdBy.id}`)} className="hover:underline">
          {vendor.createdBy.name}
        </Link>
      ),
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(vendor.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(vendor.deletedAt!, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{vendor.name}</h2>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(vendor.deletedAt!, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />
    </section>
  );
}
