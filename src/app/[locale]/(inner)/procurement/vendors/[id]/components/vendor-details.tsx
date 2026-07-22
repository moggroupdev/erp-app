import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type VendorWithCreator } from "@/types/vendor";
import { HandCoins } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function VendorDetails({ vendor }: { vendor: VendorWithCreator }) {
  const { locale, translate } = useI18n();

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
      value: <CreatorLink creator={vendor.createdBy} />,
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(vendor.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(vendor.deletedAt!, locale) }]
      : []),
  ];

  return <EntityDetails title={vendor.name} icon={HandCoins} deletedAt={vendor.deletedAt} rows={rows} />;
}
