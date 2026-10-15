"use client";

import { FileText } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import ProtectedLink from "@/components/ui/protected-link";
import useLocations from "@/hooks/reference/use-locations";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { useI18n } from "@/lib/i18n/hooks";
import type { ContractDetailed } from "@/types/contract";
import { getContractStatusLabel } from "../../helpers";

function inquiryStatusLabel(status: string, translate: (en: string, ar: string) => string) {
  switch (status) {
    case "pending":
      return translate("Pending", "قيد الانتظار");
    case "preview_scheduled":
      return translate("Preview scheduled", "المعاينة مجدولة");
    case "preview_done":
      return translate("Preview done", "المعاينة تمت");
    case "offer_sent":
      return translate("Offer sent", "العرض أُرسل");
    case "offer_accepted":
      return translate("Offer accepted", "العرض مقبول");
    case "offer_rejected":
      return translate("Offer rejected", "العرض مرفوض");
    case "cancelled":
      return translate("Cancelled", "ملغي");
    default:
      return status;
  }
}

function offerStatusLabel(status: string, translate: (en: string, ar: string) => string) {
  switch (status) {
    case "draft":
      return translate("Draft", "مسودة");
    case "sent":
      return translate("Sent", "مُرسل");
    case "accepted":
      return translate("Accepted", "مقبول");
    case "rejected":
      return translate("Rejected", "مرفوض");
    case "cancelled":
      return translate("Cancelled", "ملغي");
    default:
      return status;
  }
}

export default function ContractDetails({ contract }: { contract: ContractDetailed }) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useLocations();
  const status = getContractStatusLabel(contract, translate);

  const address = contract.deliveryAddress;
  const country = address ? helpers.getCountryById(address.countryId) : null;
  const governorate = address?.cityId ? helpers.getGovernorateOfCity(address.cityId) : null;
  const city = address?.cityId ? helpers.getCityById(address.cityId) : null;
  const locationText = [
    country ? translate(country.nameEn, country.nameAr) : null,
    governorate ? translate(governorate.nameEn, governorate.nameAr) : null,
    city ? translate(city.nameEn, city.nameAr) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const rows: DetailRow[] = [
    { key: translate("Contract code", "كود العقد"), value: contract.code, mono: true, copyText: contract.code },
    {
      key: translate("Customer", "العميل"),
      value: (
        <ProtectedLink
          permission={PERMISSIONS.READ_CUSTOMERS}
          href={`/sales/customers/${contract.customer.id}`}
          className="hover:underline"
        >
          {contract.customer.name}
        </ProtectedLink>
      ),
    },
    {
      key: translate("Legacy number", "رقم العقد الورقي"),
      value: contract.legacyNumber ? <span className="font-mono">{contract.legacyNumber}</span> : <EmptyValue />,
      copyText: contract.legacyNumber || undefined,
    },
    {
      key: translate("Work order number", "رقم أمر الشغل"),
      value: contract.legacyWorkOrderNumber ? (
        <span className="font-mono">{contract.legacyWorkOrderNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: contract.legacyWorkOrderNumber || undefined,
    },
    {
      key: translate("Status", "الحالة"),
      value: <span className={status.className}>{status.label}</span>,
    },
    {
      key: translate("Delivery address", "عنوان التسليم"),
      value: address ? (
        <span className="font-normal">
          {[address.addressLine, locationText].filter(Boolean).join(", ") || translate("Address on file", "عنوان مسجل")}
        </span>
      ) : (
        translate("Factory", "المصنع")
      ),
    },
    {
      key: translate("Delivery time", "موعد التسليم"),
      value: contract.deliveryTime ? formatDateAndTime(contract.deliveryTime, locale) : <EmptyValue />,
    },
    {
      key: translate("Work order start", "بداية أمر الشغل"),
      value: contract.startedAt ? formatDateAndTime(contract.startedAt, locale) : <EmptyValue />,
    },
    ...(contract.completedAt
      ? [
          {
            key: translate("Completed at", "تاريخ الإكمال"),
            value: formatDateAndTime(contract.completedAt, locale),
          },
        ]
      : []),
    ...(contract.cancelledAt
      ? [
          {
            key: translate("Cancelled at", "تاريخ الإلغاء"),
            value: formatDateAndTime(contract.cancelledAt, locale),
          },
          {
            key: translate("Cancelled by", "ألغاه"),
            value: <CreatorLink creator={contract.cancelledByUser} />,
          },
          ...(contract.cancellationReason
            ? [
                {
                  key: translate("Cancellation reason", "سبب الإلغاء"),
                  value: <span className="font-normal whitespace-pre-wrap">{contract.cancellationReason}</span>,
                },
              ]
            : []),
        ]
      : []),
    {
      key: translate("Discount", "الخصم"),
      value: contract.discountPct == null ? <EmptyValue /> : `${contract.discountPct}%`,
    },
    {
      key: translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`),
      value: formatMoney(contract.totalAmount),
    },
    {
      key: translate("Inquiry", "الاستفسار"),
      value: contract.inquiry ? inquiryStatusLabel(contract.inquiry.status, translate) : <EmptyValue />,
    },
    {
      key: translate("Preview", "المعاينة"),
      value: contract.preview ? formatDateAndTime(contract.preview.scheduledAt, locale) : <EmptyValue />,
    },
    {
      key: translate("Offer", "العرض"),
      value: contract.offer ? offerStatusLabel(contract.offer.status, translate) : <EmptyValue />,
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: contract.notes ? <span className="font-normal whitespace-pre-wrap">{contract.notes}</span> : <EmptyValue />,
    },
    {
      key: translate("Created by", "أنشئ بواسطة"),
      value: <CreatorLink creator={contract.createdBy} />,
    },
    {
      key: translate("Created at", "تاريخ الإنشاء"),
      value: formatDateAndTime(contract.createdAt, locale),
    },
  ];

  return <EntityDetails title={contract.code} icon={FileText} rows={rows} />;
}
