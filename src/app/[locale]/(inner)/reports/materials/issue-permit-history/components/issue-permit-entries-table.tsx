"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { useMemo } from "react";
import { Badge, Table } from "@mantine/core";
import { Table2 } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import {
  getProductionSubDepartmentLabel,
  isValidProductionSubDepartment,
} from "@/lib/constants/enums/production-sub-departments";
import { LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES } from "@/lib/constants/enums/legacy-issue-permit-work-order-types";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { MaterialsIssuePermitHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";

type TableEntry = MaterialsIssuePermitHistoryEntry & {
  displayQuantity: number | null;
  displayUnit: MaterialUnit;
};

export default function IssuePermitEntriesTable({ data }: { data: TableEntry[] }) {
  const { locale, translate } = useI18n();

  const rows = useMemo(
    () => [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data],
  );

  return (
    <ReportCard
      title={translate("Issue Permit History", "سجل أذونات الصرف")}
      description={translate(
        "Individual issue permit lines for this material (newest first).",
        "بنود أذونات الصرف الفردية لهذه المادة (الأحدث أولاً).",
      )}
      icon={Table2}
      accent="gray"
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">{translate("Permit Number", "رقم الإذن")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Sub-department", "القسم الفرعي")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Editor", "المحرر")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Reference", "المرجع")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty", "الكمية")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Notes", "ملاحظات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const departmentLabel =
                  row.productionSubDepartment && isValidProductionSubDepartment(row.productionSubDepartment)
                    ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                    : row.productionSubDepartment || translate("Unassigned", "غير محدد");
                const quantity = row.displayQuantity != null ? row.displayQuantity : row.quantity;
                const unitLabel = getMaterialUnitLabel(row.displayUnit, locale);
                const reference =
                  row.workOrderNumberType === LEGACY_ISSUE_PERMIT_WORK_ORDER_TYPES.BASE_CONTRACT
                    ? row.contractNumber
                    : row.workOrderNumber;

                return (
                  <Table.Tr key={row.issuePermitItemId} className="text-gray-600">
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <ProtectedLink
                          permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                          href={`/warehouse/legacy-issue-permits/${row.issuePermitId}`}
                          className="font-mono font-medium text-gray-800 hover:underline"
                        >
                          {row.issuePermitNumber}
                        </ProtectedLink>
                        <CopyButton text={row.issuePermitNumber} />
                        {row.isCancelled && (
                          <Badge size="sm" variant="light" color="clay" radius="sm">
                            {translate("Cancelled", "ملغي")}
                          </Badge>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      {new Date(row.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Table.Td>
                    <Table.Td>{departmentLabel}</Table.Td>
                    <Table.Td>
                      <ProtectedLink
                        permission={PERMISSIONS.READ_USERS}
                        href={`/organization/users/${row.creatorId}`}
                        className="text-gray-800 hover:underline"
                      >
                        {row.creatorName}
                      </ProtectedLink>
                    </Table.Td>
                    <Table.Td>
                      {reference ? (
                        <span className="font-mono text-gray-800">{reference}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Table.Td>
                    <Table.Td>{unitLabel}</Table.Td>
                    <Table.Td>{quantity != null ? formatQuantity(quantity) : <span className="text-gray-400">-</span>}</Table.Td>
                    <Table.Td className="max-w-xs truncate text-wrap">
                      {row.notes?.trim() ? row.notes : <span className="text-gray-400">-</span>}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
