import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type SupplierWithCreator } from "@/types/supplier";
import { HandCoins } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function SupplierDetails({ supplier }: { supplier: SupplierWithCreator }) {
  const { locale, translate } = useI18n();

  const isDeleted = !!supplier.deletedAt;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: supplier.code, mono: true, copyText: supplier.code },
    {
      key: translate("Phone", "الهاتف"),
      value: supplier.phone ? <a href={`tel:${supplier.phone}`}>{supplier.phone}</a> : <EmptyValue />,
    },
    {
      key: translate("Email", "البريد الإلكتروني"),
      value: supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : <EmptyValue />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: supplier.notes ? <span className="font-normal whitespace-pre-wrap">{supplier.notes}</span> : <EmptyValue />,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={supplier.createdBy} />,
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(supplier.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(supplier.deletedAt!, locale) }]
      : []),
  ];

  return <EntityDetails title={supplier.name} icon={HandCoins} deletedAt={supplier.deletedAt} rows={rows} />;
}
