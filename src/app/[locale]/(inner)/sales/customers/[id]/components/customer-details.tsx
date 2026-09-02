import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { type CustomerWithCreator } from "@/types/customer";
import { getCustomerClassificationLabel } from "@/lib/constants/enums/customer-classifications";
import { Users } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function CustomerDetails({ customer }: { customer: CustomerWithCreator }) {
  const { locale, translate } = useI18n();

  const isBlacklisted = !!customer.blacklistedAt;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: customer.code, mono: true, copyText: customer.code },
    {
      key: translate("Classification", "التصنيف"),
      value: customer.classification ? getCustomerClassificationLabel(customer.classification, locale) : <EmptyValue />,
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
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={customer.createdBy} />,
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(customer.createdAt, locale),
    },
    ...(isBlacklisted
      ? [
          {
            key: translate("Blacklist Date", "تاريخ الإدراج في القائمة السوداء"),
            value: formatDateAndTime(customer.blacklistedAt!, locale),
          },
          {
            key: translate("Added to Blacklist By", "أضيف للقائمة السوداء بواسطة"),
            value: <CreatorLink creator={customer.addedToBlacklistBy} />,
          },
        ]
      : []),
  ];

  return (
    <EntityDetails
      title={customer.name}
      icon={Users}
      deletedAt={customer.blacklistedAt}
      inactiveLabel={translate("Blacklisted", "محظور")}
      rows={rows}
    />
  );
}
