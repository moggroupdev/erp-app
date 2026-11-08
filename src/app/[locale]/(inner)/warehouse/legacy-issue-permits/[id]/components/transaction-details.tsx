import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import {
  getLegacyIssuePermitTypeLabel,
  LEGACY_ISSUE_PERMIT_TYPES,
} from "@/lib/constants/enums/legacy-issue-permit-types";
import { getLegacyIssuePermitMaintenanceOrderTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type LegacyIssuePermitDetailed } from "@/types/legacy-issue-permit";
import { Badge } from "@mantine/core";
import { History } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function TransactionDetails({
  transaction,
  headerEnd,
}: {
  transaction: LegacyIssuePermitDetailed;
  headerEnd?: ReactNode;
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
      key: translate("Issue Permit Date", "تاريخ إذن الصرف"),
      value: formatDate(transaction.date, locale),
    },
    {
      key: translate("Issue Order Number", "رقم طلب الصرف"),
      value: transaction.issueOrderNumber || <EmptyValue />,
      mono: !!transaction.issueOrderNumber,
      copyText: transaction.issueOrderNumber || undefined,
    },
    {
      key: translate("Issue Order Date", "تاريخ طلب الصرف"),
      value: transaction.issueOrderDate ? formatDate(transaction.issueOrderDate, locale) : <EmptyValue />,
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
      key: translate("Permit Type", "نوع الإذن"),
      value: getLegacyIssuePermitTypeLabel(transaction.permitType, locale),
    },
    ...(transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.CONTRACT_REVIEW
      ? [
          {
            key: translate("Contract review number", "رقم مراجعة العقد"),
            value: transaction.contractNumber ? (
              <span className="font-mono">{transaction.contractNumber}</span>
            ) : (
              <EmptyValue />
            ),
            copyText: transaction.contractNumber || undefined,
          },
        ]
      : []),
    ...(transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.MAINTENANCE_ORDER
      ? [
          {
            key: translate("Maintenance Order Number", "رقم أمر الشغل"),
            value: transaction.maintenanceOrderNumber ? (
              <span className="font-mono">{transaction.maintenanceOrderNumber}</span>
            ) : (
              <EmptyValue />
            ),
            copyText: transaction.maintenanceOrderNumber || undefined,
          },
          {
            key: translate("Maintenance Type", "نوع الصيانة"),
            value: transaction.maintenanceOrderType ? (
              getLegacyIssuePermitMaintenanceOrderTypeLabel(transaction.maintenanceOrderType, locale)
            ) : (
              <EmptyValue />
            ),
          },
        ]
      : []),
    ...(transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.CONTRACT_REVIEW ||
    transaction.permitType === LEGACY_ISSUE_PERMIT_TYPES.MAINTENANCE_ORDER
      ? [
          {
            key: translate("Customer", "العميل"),
            value: transaction.hasMultipleCustomers ? (
              translate("Multiple customers", "عملاء متعددون")
            ) : transaction.customer ? (
              <span>
                {transaction.customer.name}{" "}
                <span className="font-mono text-gray-500">({transaction.customer.code})</span>
              </span>
            ) : (
              <EmptyValue />
            ),
          },
        ]
      : []),
    ...(transaction.isCancelled
      ? [
          {
            key: translate("Status", "الحالة"),
            value: (
              <Badge size="sm" variant="light" color="clay" radius="md">
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

  return (
    <EntityDetails title={transaction.issuePermitNumber} icon={History} headerEnd={headerEnd} rows={rows} />
  );
}
