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
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getRequisitionStatusLabel } from "@/app/[locale]/(inner)/procurement/material-requisitions/helpers";
import type { PurchasingMaterialsRequisitionHistoryEntry } from "@/types/reports";
import ReportCard from "../../components/report-card";

type TableEntry = PurchasingMaterialsRequisitionHistoryEntry & {
  displayQuantity: number | null;
  displayUnit: MaterialUnit;
};

export default function RequisitionEntriesTable({ data }: { data: TableEntry[] }) {
  const { locale, translate } = useI18n();

  const rows = useMemo(
    () => [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data],
  );

  return (
    <ReportCard
      title={translate("Requisition History", "سجل طلبات الشراء")}
      description={translate(
        "Individual purchase requisition lines for this material (newest first).",
        "بنود طلبات الشراء الفردية لهذه المادة (الأحدث أولاً).",
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
                <Table.Th className="text-gray-600">{translate("MPReq Number", "رقم طلب الشراء")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Sub-department", "القسم الفرعي")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Editor", "المحرر")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Qty", "الكمية")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Status", "الحالة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Notes", "ملاحظات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => {
                const status = getRequisitionStatusLabel(row.status, translate);
                const departmentLabel = isValidProductionSubDepartment(row.productionSubDepartment)
                  ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
                  : row.productionSubDepartment;
                const quantity =
                  row.displayQuantity != null ? row.displayQuantity : row.quantityRequested;
                const unitLabel = getMaterialUnitLabel(row.displayUnit, locale);

                return (
                  <Table.Tr key={row.requisitionItemId} className="text-gray-600">
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <ProtectedLink
                          permission={PERMISSIONS.READ_MATERIAL_PURCHASE_REQUISITIONS}
                          href={`/procurement/material-requisitions/${row.requisitionId}`}
                          className="font-mono font-medium text-gray-800 hover:underline"
                        >
                          {row.requisitionCode}
                        </ProtectedLink>
                        <CopyButton text={row.requisitionCode} />
                      </div>
                    </Table.Td>
                    <Table.Td>
                      {new Date(row.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Table.Td>
                    <Table.Td>{departmentLabel}</Table.Td>
                    <Table.Td>
                      <ProtectedLink
                        permission={PERMISSIONS.READ_USERS}
                        href={`/organization/users/${row.createdById}`}
                        className="text-gray-800 hover:underline"
                      >
                        {row.createdByName}
                      </ProtectedLink>
                    </Table.Td>
                    <Table.Td>{unitLabel}</Table.Td>
                    <Table.Td>{formatQuantity(quantity)}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light" color={status.color} radius="sm">
                        {status.label}
                      </Badge>
                    </Table.Td>
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
