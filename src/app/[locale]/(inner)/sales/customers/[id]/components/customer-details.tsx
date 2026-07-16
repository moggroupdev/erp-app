import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type CustomerWithCreator } from "@/types/customer";
import { Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";

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

export default function CustomerDetails({ customer }: { customer: CustomerWithCreator }) {
  const { locale, translate } = useI18n();

  const isDeleted = !!customer.deletedAt;

  const rows: DetailRow[] = [
    { key: translate("Customer ID", "معرف العميل"), value: customer.id, mono: true, copyText: customer.id },
    { key: translate("Code", "الكود"), value: customer.code, mono: true, copyText: customer.code },
    {
      key: translate("Status", "الحالة"),
      value: isDeleted ? (
        <span className="text-red-600">{translate("Deleted", "محذوف")}</span>
      ) : (
        <span className="text-teal-600">{translate("Active", "نشط")}</span>
      ),
    },
    {
      key: translate("Phone", "الهاتف"),
      value: customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : <EmptyValue />,
    },
    {
      key: translate("Email", "البريد الإلكتروني"),
      value: customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : <EmptyValue />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: customer.notes ? <span className="font-normal whitespace-pre-wrap">{customer.notes}</span> : <EmptyValue />,
    },
    { key: translate("Created By", "أنشئ بواسطة"), value: customer.createdBy.name },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(customer.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(customer.deletedAt!, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{customer.name}</h2>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(customer.deletedAt!, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />
    </section>
  );
}
