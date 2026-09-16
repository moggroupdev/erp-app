"use client";

import { Table } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import type { AuditLogDetailed } from "@/types/audit-log";
import SnapshotValue from "./snapshot-value";

type SnapshotDiffTableProps = {
  log: AuditLogDetailed;
};

export default function SnapshotDiffTable({ log }: SnapshotDiffTableProps) {
  const { translate } = useI18n();
  const columns = log.changedColumns ?? [];

  if (log.action !== "update" || columns.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-lg font-semibold text-gray-900">{translate("Changed columns", "الأعمدة المتغيرة")}</h4>
      <div className="overflow-x-auto">
        <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{translate("Column", "العمود")}</Table.Th>
              <Table.Th>{translate("Before", "قبل")}</Table.Th>
              <Table.Th>{translate("After", "بعد")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {columns.map((column) => (
              <Table.Tr key={column}>
                <Table.Td className="font-mono text-gray-800">{column}</Table.Td>
                <Table.Td className="max-w-xs text-gray-600">
                  <SnapshotValue value={log.oldRow?.[column]} />
                </Table.Td>
                <Table.Td className="max-w-xs text-gray-600">
                  <SnapshotValue value={log.newRow?.[column]} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </section>
  );
}
