import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type SupplierWithCreator } from "@/types/supplier";
import { getSupplierClassificationLabel } from "@/lib/constants/enums/supplier-classifications";
import { HandCoins } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, WebsiteLink, type DetailRow } from "@/components/ui/entity-details";

export default function SupplierDetails({ supplier }: { supplier: SupplierWithCreator }) {
  const { locale, translate } = useI18n();

  const isBlacklisted = !!supplier.blacklistedAt;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: supplier.code, mono: true, copyText: supplier.code },
    {
      key: translate("Classification", "التصنيف"),
      value: supplier.classification ? getSupplierClassificationLabel(supplier.classification, locale) : <EmptyValue />,
    },
    {
      key: translate("Website", "الموقع الالكتروني"),
      value: supplier.website ? <WebsiteLink website={supplier.website} /> : <EmptyValue />,
    },
    {
      key: translate("Tax Number", "الرقم الضريبي"),
      value: supplier.taxNumber ? <span className="font-mono">{supplier.taxNumber}</span> : <EmptyValue />,
      copyText: supplier.taxNumber ?? undefined,
    },
    {
      key: translate("Commercial Registration", "رقم السجل التجاري"),
      value: supplier.commercialRegistrationNumber ? (
        <span className="font-mono">{supplier.commercialRegistrationNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: supplier.commercialRegistrationNumber ?? undefined,
    },
    {
      key: translate("Phone", "الهاتف"),
      value: supplier.phone ? <a href={`tel:${supplier.phone}`}>{supplier.phone}</a> : <EmptyValue />,
    },
    {
      key: translate("Email", "البريد الإلكتروني"),
      value: supplier.email ? (
        <a
          href={`mailto:${supplier.email}`}
          className="break-all text-haze-700 underline decoration-haze-200 underline-offset-4 hover:decoration-haze-600"
        >
          {supplier.email}
        </a>
      ) : (
        <EmptyValue />
      ),
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
    ...(isBlacklisted
      ? [
          {
            key: translate("Blacklist Date", "تاريخ الإدراج في القائمة السوداء"),
            value: formatDateAndTime(supplier.blacklistedAt!, locale),
          },
          {
            key: translate("Added to Blacklist By", "أضيف للقائمة السوداء بواسطة"),
            value: <CreatorLink creator={supplier.addedToBlacklistBy} />,
          },
        ]
      : []),
  ];

  return (
    <EntityDetails
      title={supplier.name}
      icon={HandCoins}
      deletedAt={supplier.blacklistedAt}
      inactiveLabel={translate("Blacklisted", "محظور")}
      rows={rows}
    />
  );
}
