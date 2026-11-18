"use client";

import { Table } from "@mantine/core";
import { Building2, FileType, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import { getLegacyIssuePermitTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-types";
import { getLegacyIssuePermitMaintenanceOrderTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-maintenance-order-types";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import type {
  LegacyIssuePermitSummaryByMaintenanceOrderType,
  LegacyIssuePermitSummaryByPermitType,
  LegacyIssuePermitSummaryByProductionSubDepartment,
} from "@/types/reports";
import ReportCard from "./report-card";

function CountsTable({
  rows,
}: {
  rows: { key: string; label: string; permitCount: number; cancelledCount: number; itemCount: number; headerNoteCount: number }[];
}) {
  const { translate } = useI18n();

  if (rows.every((row) => row.permitCount === 0)) {
    return <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl">
      <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
        <Table.Thead className="bg-gray-50">
          <Table.Tr>
            <Table.Th className="text-gray-600">{translate("Group", "المجموعة")}</Table.Th>
            <Table.Th className="text-gray-600">{translate("Permits", "الأذونات")}</Table.Th>
            <Table.Th className="text-gray-600">{translate("Cancelled", "ملغاة")}</Table.Th>
            <Table.Th className="text-gray-600">{translate("Items", "البنود")}</Table.Th>
            <Table.Th className="text-gray-600">{translate("Header Notes", "ملاحظات الرأس")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows
            .filter((row) => row.permitCount > 0 || row.itemCount > 0)
            .map((row) => (
              <Table.Tr key={row.key} className="text-gray-600">
                <Table.Td className="font-medium text-gray-800">{row.label}</Table.Td>
                <Table.Td>{row.permitCount}</Table.Td>
                <Table.Td>{row.cancelledCount}</Table.Td>
                <Table.Td>{row.itemCount}</Table.Td>
                <Table.Td>{row.headerNoteCount}</Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

export function ByPermitTypeTable({ data }: { data: LegacyIssuePermitSummaryByPermitType[] }) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("By Permit Type", "حسب نوع الإذن")}
      description={translate("Volume and notes by legacy issue permit type.", "الحجم والملاحظات حسب نوع إذن الصرف المرحلي.")}
      icon={FileType}
      accent="sky"
    >
      <CountsTable
        rows={data.map((row) => ({
          key: row.permitType,
          label: getLegacyIssuePermitTypeLabel(row.permitType, locale),
          permitCount: row.permitCount,
          cancelledCount: row.cancelledCount,
          itemCount: row.itemCount,
          headerNoteCount: row.headerNoteCount,
        }))}
      />
    </ReportCard>
  );
}

export function ByProductionSubDepartmentTable({
  data,
}: {
  data: LegacyIssuePermitSummaryByProductionSubDepartment[];
}) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("By Production Sub-Department", "حسب قسم الإنتاج الفرعي")}
      description={translate(
        "Includes a bucket for permits without a production sub-department.",
        "يشمل مجموعة للأذونات بدون قسم إنتاج فرعي.",
      )}
      icon={Building2}
      accent="plum"
    >
      <CountsTable
        rows={data.map((row) => ({
          key: row.productionSubDepartment ?? "none",
          label: row.productionSubDepartment
            ? getProductionSubDepartmentLabel(row.productionSubDepartment, locale)
            : translate("No department", "بدون قسم"),
          permitCount: row.permitCount,
          cancelledCount: row.cancelledCount,
          itemCount: row.itemCount,
          headerNoteCount: row.headerNoteCount,
        }))}
      />
    </ReportCard>
  );
}

export function ByMaintenanceOrderTypeTable({
  data,
}: {
  data: LegacyIssuePermitSummaryByMaintenanceOrderType[];
}) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("By Maintenance Order Type", "حسب نوع أمر الصيانة")}
      description={translate(
        "Among maintenance-order permits, including a missing-type bucket.",
        "ضمن أذونات أوامر الصيانة، مع مجموعة للنوع المفقود.",
      )}
      icon={Wrench}
      accent="amber"
    >
      <CountsTable
        rows={data.map((row) => ({
          key: row.maintenanceOrderType ?? "none",
          label: row.maintenanceOrderType
            ? getLegacyIssuePermitMaintenanceOrderTypeLabel(row.maintenanceOrderType, locale)
            : translate("Missing type", "نوع مفقود"),
          permitCount: row.permitCount,
          cancelledCount: row.cancelledCount,
          itemCount: row.itemCount,
          headerNoteCount: row.headerNoteCount,
        }))}
      />
    </ReportCard>
  );
}
