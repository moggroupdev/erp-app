import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import {
  getLegacyIssuePermitWorkOrderTypeLabel,
  LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES,
} from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Badge } from "@mantine/core";
import { History } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function TransactionDetails({ transaction }: { transaction: LegacyIssuePermitDetailed }) {
  const { locale, translate } = useI18n();

  const rows: DetailRow[] = [
    {
      key: translate("Issue Permit Number", "رقم إذن الصرف"),
      value: transaction.issuePermitNumber,
      mono: true,
      copyText: transaction.issuePermitNumber,
    },
    {
      key: translate("Issue Permit Date", "تاريخ إذن الصرف"),
      value: formatDateAndTime(transaction.date, locale),
    },
    {
      key: translate("Issue Order Number", "رقم طلب الصرف"),
      value: transaction.issueOrderNumber,
      mono: true,
      copyText: transaction.issueOrderNumber,
    },
    {
      key: translate("Issue Order Date", "تاريخ طلب الصرف"),
      value: formatDateAndTime(transaction.issueOrderDate, locale),
    },
    {
      key: translate("Creator", "المحرر"),
      value: <CreatorLink creator={transaction.creator} />,
    },
    {
      key: translate("Production Department", "قسم الانتاج"),
      value: transaction.productionSubDepartment ? (
        getProductionSubDepartmentLabel(transaction.productionSubDepartment, locale)
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Contract Number", "رقم مراجعة العقد"),
      value: transaction.contractNumber ? <span className="font-mono">{transaction.contractNumber}</span> : <EmptyValue />,
      copyText: transaction.contractNumber || undefined,
    },
    {
      key: translate("Work Order Number", "رقم أمر الشغل"),
      value: transaction.workOrderNumber ? <span className="font-mono">{transaction.workOrderNumber}</span> : <EmptyValue />,
      copyText: transaction.workOrderNumber || undefined,
    },
    ...(transaction.workOrderNumberType !== LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT
      ? [
          {
            key: translate("Work Order Type", "نوع أمر الشغل"),
            value: getLegacyIssuePermitWorkOrderTypeLabel(transaction.workOrderNumberType, locale),
          },
        ]
      : []),
    ...(transaction.isCancelled
      ? [
          {
            key: translate("Status", "الحالة"),
            value: (
              <Badge size="sm" variant="light" color="red" radius="md">
                {translate("Cancelled", "ملغي")}
              </Badge>
            ),
          },
        ]
      : []),
    {
      key: translate("Notes", "الملاحظات"),
      value: transaction.notes ? (
        <span className="font-normal whitespace-pre-wrap">{transaction.notes}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Entry Date", "تاريخ الإدخال"),
      value: formatDateAndTime(transaction.createdAt, locale),
    },
  ];

  return <EntityDetails title={transaction.issuePermitNumber} icon={History} rows={rows} />;
}
