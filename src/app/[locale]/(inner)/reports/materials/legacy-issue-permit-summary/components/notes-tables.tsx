"use client";

import { Table } from "@mantine/core";
import { StickyNote } from "lucide-react";
import ProtectedLink from "@/components/ui/protected-link";
import { useI18n } from "@/lib/i18n/hooks";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getLegacyIssuePermitTypeLabel } from "@/lib/constants/enums/legacy-issue-permit-types";
import { formatDate } from "@/lib/helpers/date-formaters";
import type {
  LegacyIssuePermitSummaryHeaderNote,
  LegacyIssuePermitSummaryLineNote,
} from "@/types/reports";
import ReportCard from "./report-card";

export function HeaderNotesTable({ data }: { data: LegacyIssuePermitSummaryHeaderNote[] }) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("Recent Header Notes", "أحدث ملاحظات الرأس")}
      description={translate("Up to 30 newest permit header notes.", "حتى 30 من أحدث ملاحظات رأس الأذونات.")}
      icon={StickyNote}
      accent="sky"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No notes available", "لا توجد ملاحظات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">{translate("Permit", "الإذن")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Type", "النوع")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Notes", "الملاحظات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.id} className="text-gray-600">
                  <Table.Td className="whitespace-nowrap font-medium text-gray-800">
                    <ProtectedLink
                      permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                      href={`/warehouse/legacy-issue-permits/${row.id}`}
                      className="text-haze-700 hover:underline"
                    >
                      {row.issuePermitNumber}
                    </ProtectedLink>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">{formatDate(row.date, locale)}</Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    {getLegacyIssuePermitTypeLabel(row.permitType, locale)}
                  </Table.Td>
                  <Table.Td className="max-w-md whitespace-pre-wrap break-words text-gray-800">{row.notes}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}

export function LineNotesTable({ data }: { data: LegacyIssuePermitSummaryLineNote[] }) {
  const { locale, translate } = useI18n();

  return (
    <ReportCard
      title={translate("Recent Line Notes", "أحدث ملاحظات البنود")}
      description={translate("Up to 30 newest line-item notes.", "حتى 30 من أحدث ملاحظات البنود.")}
      icon={StickyNote}
      accent="gray"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No notes available", "لا توجد ملاحظات")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">{translate("Permit", "الإذن")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Notes", "الملاحظات")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.itemId} className="text-gray-600">
                  <Table.Td className="whitespace-nowrap font-medium text-gray-800">
                    <ProtectedLink
                      permission={PERMISSIONS.READ_LEGACY_ISSUE_PERMITS}
                      href={`/warehouse/legacy-issue-permits/${row.issuePermitId}`}
                      className="text-haze-700 hover:underline"
                    >
                      {row.issuePermitNumber}
                    </ProtectedLink>
                  </Table.Td>
                  <Table.Td className="whitespace-nowrap">{formatDate(row.date, locale)}</Table.Td>
                  <Table.Td className="whitespace-nowrap">
                    {row.materialCode ? (
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="text-gray-800 hover:underline"
                      >
                        {row.materialCode}
                      </ProtectedLink>
                    ) : (
                      translate("Note only", "ملاحظة فقط")
                    )}
                  </Table.Td>
                  <Table.Td className="max-w-md whitespace-pre-wrap break-words text-gray-800">{row.notes}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
