import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getLegacyIssuePermitWorkOrderTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Badge } from "@mantine/core";
import { History } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function TransactionDetails({
  transaction,
}: {
  transaction: LegacyIssuePermitDetailed;
}) {
  const { locale, translate } = useI18n();

  const rows: DetailRow[] = [
    {
      key: translate("Issue Permit Number", "رقم إذن الصرف"),
      value: transaction.issuePermitNumber,
      mono: true,
      copyText: transaction.issuePermitNumber,
    },
    {
      key: translate("Issue Order Number", "رقم أمر الصرف"),
      value: transaction.issueOrderNumber,
      mono: true,
      copyText: transaction.issueOrderNumber,
    },
    {
      key: translate("Issue Order Date", "تاريخ أمر الصرف"),
      value: formatDateAndTime(transaction.issueOrderDate, locale),
    },
    {
      key: translate("Date", "التاريخ"),
      value: formatDateAndTime(transaction.date, locale),
    },
    {
      key: translate("Creator", "المنشئ"),
      value: <CreatorLink creator={transaction.creator} />,
    },
    {
      key: translate("Production Sub-Department", "القسم الفرعي للإنتاج"),
      value: transaction.productionSubDepartment ? (
        getProductionSubDepartmentLabel(transaction.productionSubDepartment, locale)
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Contract Number", "رقم العقد"),
      value: transaction.contractNumber ? (
        <span className="font-mono">{transaction.contractNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: transaction.contractNumber || undefined,
    },
    {
      key: translate("Work Order Number", "رقم أمر العمل"),
      value: transaction.workOrderNumber ? (
        <span className="font-mono">{transaction.workOrderNumber}</span>
      ) : (
        <EmptyValue />
      ),
      copyText: transaction.workOrderNumber || undefined,
    },
    {
      key: translate("Work Order Type", "نوع أمر العمل"),
      value: getLegacyIssuePermitWorkOrderTypeLabel(transaction.workOrderNumberType, locale),
    },
    {
      key: translate("Status", "الحالة"),
      value: transaction.isCancelled ? (
        <Badge size="sm" variant="light" color="red" radius="md">
          {translate("Cancelled", "ملغي")}
        </Badge>
      ) : (
        <Badge size="sm" variant="light" color="teal" radius="md">
          {translate("Active", "نشط")}
        </Badge>
      ),
    },
    {
      key: translate("Notes", "الملاحظات"),
      value: transaction.notes ? (
        <span className="font-normal whitespace-pre-wrap">{transaction.notes}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={transaction.createdBy} />,
    },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(transaction.createdAt, locale),
    },
  ];

  return (
    <EntityDetails
      title={transaction.issuePermitNumber}
      icon={History}
      rows={rows}
    />
  );
}
