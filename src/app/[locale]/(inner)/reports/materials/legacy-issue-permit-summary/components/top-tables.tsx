"use client";

import { Select, Table } from "@mantine/core";
import { Boxes, UserRound, Users } from "lucide-react";
import ProtectedLink from "@/components/ui/protected-link";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import {
  getMaterialUnitLabel,
  MATERIAL_UNIT_LABELS_LIST,
  type MaterialUnit,
} from "@/lib/constants/enums/material-units";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { resolveDisplayUnit } from "@/lib/helpers/unit-conversion";
import type {
  LegacyIssuePermitSummaryTopCreator,
  LegacyIssuePermitSummaryTopCustomer,
  LegacyIssuePermitSummaryTopMaterial,
} from "@/types/reports";
import ReportCard from "./report-card";

const BASE_UNIT_VALUE = "__base__";

export function TopMaterialsTable({
  data,
  displayUnit,
  onDisplayUnitChange,
}: {
  data: LegacyIssuePermitSummaryTopMaterial[];
  displayUnit: MaterialUnit | null;
  onDisplayUnitChange: (unit: MaterialUnit | null) => void;
}) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("Top Materials", "أعلى المواد")}
      description={translate(
        "Materials ranked by line count. Quantities are converted to each material base unit.",
        "المواد مرتبة حسب عدد البنود. الكميات محولة إلى الوحدة الأساسية لكل مادة.",
      )}
      icon={Boxes}
      accent="sky"
      headerAction={
        <Select
          value={displayUnit ?? BASE_UNIT_VALUE}
          onChange={(value) => {
            if (!value || value === BASE_UNIT_VALUE) onDisplayUnitChange(null);
            else onDisplayUnitChange(value as MaterialUnit);
          }}
          label={translate("Display unit", "وحدة العرض")}
          data={[
            { value: BASE_UNIT_VALUE, label: translate("Base unit", "الوحدة الأساسية") },
            ...MATERIAL_UNIT_LABELS_LIST.map((item) => ({
              value: item.value,
              label: locale === "ar" ? item.label.ar : item.label.en,
            })),
          ]}
          allowDeselect={false}
          radius="md"
          w={180}
        />
      }
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Unit", "الوحدة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Lines", "البنود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Issued Qty", "الكمية المصروفة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Cancelled Qty", "الكمية الملغاة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Missing Conv.", "تحويل مفقود")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => {
                const { unit, factor } = resolveDisplayUnit(
                  displayUnit,
                  row.unitOfMeasurement,
                  row.unitConversions,
                );

                return (
                  <Table.Tr key={row.materialCode} className="text-gray-600">
                    <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                    <Table.Td className="max-w-60 truncate font-medium text-gray-800">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="text-gray-800 hover:underline"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </ProtectedLink>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1">
                        <span>{row.materialCode}</span>
                        <CopyButton text={row.materialCode} />
                      </div>
                    </Table.Td>
                    <Table.Td>{getMaterialUnitLabel(unit, locale)}</Table.Td>
                    <Table.Td>{row.lineCount}</Table.Td>
                    <Table.Td>{formatBaseQuantityForDisplay(row.issuedQuantityInBase, factor)}</Table.Td>
                    <Table.Td>{formatBaseQuantityForDisplay(row.cancelledQuantityInBase, factor)}</Table.Td>
                    <Table.Td>{row.missingConversionCount}</Table.Td>
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

export function TopCustomersTable({ data }: { data: LegacyIssuePermitSummaryTopCustomer[] }) {
  const { translate } = useI18n();

  return (
    <ReportCard
      title={translate("Top Customers", "أعلى العملاء")}
      description={translate(
        "Customers linked on contract review or maintenance permits. Multiple-customer permits are counted separately in the overview.",
        "العملاء المرتبطون بأذونات مراجعة العقود أو الصيانة. أذونات عدة عملاء تُحسب منفصلة في الملخص.",
      )}
      icon={Users}
      accent="teal"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Customer", "العميل")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Permits", "الأذونات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.customerId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">
                    <ProtectedLink
                      permission={PERMISSIONS.READ_CUSTOMERS}
                      href={`/sales/customers/${row.customerId}`}
                      className="text-gray-800 hover:underline"
                    >
                      {row.customerName}
                    </ProtectedLink>
                  </Table.Td>
                  <Table.Td>{row.permitCount}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}

export function TopCreatorsTable({ data }: { data: LegacyIssuePermitSummaryTopCreator[] }) {
  const { translate } = useI18n();

  return (
    <ReportCard
      title={translate("Top Creators", "أعلى المنشئين")}
      description={translate("Users who created the most legacy issue permits.", "المستخدمون الذين أنشؤوا أكثر أذونات الصرف المرحلية.")}
      icon={UserRound}
      accent="gray"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Creator", "المنشئ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Permits", "الأذونات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.creatorId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td className="font-medium text-gray-800">{row.creatorName}</Table.Td>
                  <Table.Td>{row.permitCount}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
