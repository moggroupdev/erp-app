"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import mmBomsApi from "@/lib/api/mm-boms";
import { groupMmComponentRequirements } from "@/lib/helpers/bom-display";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import { Badge, Table } from "@mantine/core";
import { Info } from "lucide-react";

export default function MmComponentsSection({
  mmRows,
}: {
  mmRows: {
    key: string;
    materialCode: string;
    materialTitle: string;
    unitOfMeasurement: MaterialUnit | null;
    quantityRequired: number | "";
  }[];
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  const mmMaterialCodes = useMemo(() => [...new Set(mmRows.map((row) => row.materialCode))], [mmRows]);

  const mmBomQueries = useQueries({
    queries: mmMaterialCodes.map((manufacturedMaterialCode) => ({
      queryKey: queryKeys.mmBoms.detail(manufacturedMaterialCode),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        mmBomsApi.getByMaterial({ privateRequest, manufacturedMaterialCode, signal }),
      staleTime: staleTimes.mmBoms,
    })),
  });

  const mmBomDataKey = mmBomQueries.map((query) => query.dataUpdatedAt).join("|");
  const isMmBomsFetching = mmBomQueries.some((query) => query.isFetching);

  const componentGroups = useMemo(
    () =>
      groupMmComponentRequirements(
        mmRows.map((row) => {
          const queryIndex = mmMaterialCodes.indexOf(row.materialCode);
          return {
            key: row.key,
            materialCode: row.materialCode,
            materialTitle: row.materialTitle,
            unitOfMeasurement: row.unitOfMeasurement,
            quantityRequired: typeof row.quantityRequired === "number" ? row.quantityRequired : null,
            mmBom: mmBomQueries[queryIndex]?.data,
          };
        }),
      ),
    // mmBomDataKey tracks when query data changes without depending on the unstable queries array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mmRows, mmMaterialCodes, mmBomDataKey],
  );

  const totalComponents = componentGroups.reduce((sum, group) => sum + group.components.length, 0);

  if (mmRows.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 p-4">
      <div className="mb-2.5 flex items-start gap-2 border-b border-sky-100 pb-3.5">
        <Info size={14} className="mt-0.5 shrink-0 text-sky-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">
              {translate("Manufactured Material Components", "مكونات المواد المصنعة")}
            </h3>
            <Badge size="xs" variant="light" color="blue">
              {mmRows.length} {translate("Manufactured Materials", "مواد مصنعة")}
            </Badge>
            {!isMmBomsFetching && totalComponents > 0 && (
              <Badge size="xs" variant="light" color="gray">
                {totalComponents} {translate("components", "مكونات")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {translate(
              "The manufactured materials listed require component materials. These components will be appended to this bill of materials automatically upon creation; they need not be entered manually.",
              "المواد المصنعة المدرجة تتطلب مواداً خاماً مكونة لها. ستُضاف هذه المكونات تلقائياً إلى قائمة المواد هذه عند الإنشاء، ولا يلزم إدخالها يدوياً.",
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-2 p-2 lg:grid-cols-2">
        {componentGroups.map((group) => {
          const unitLabel = group.unitOfMeasurement ? getMaterialUnitLabel(group.unitOfMeasurement, locale) : "";

          return (
            <div key={group.key} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-amber-50/50 px-2.5 py-2.5">
                <div className="flex gap-1.5">
                  <p className="truncate text-xs font-semibold text-gray-900">{group.materialTitle}</p>
                  <p className="truncate text-xs text-gray-500">{group.materialCode}</p>
                </div>
                <span className="text-xs text-gray-700">
                  {group.quantityRequired !== null ? (
                    <div className="flex items-center gap-1.5">
                      {unitLabel ? <span className="text-xs text-gray-500">{unitLabel}</span> : null}
                      <span className="text-xs font-medium text-gray-700">{formatQuantity(group.quantityRequired)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">{translate("Not set", "غير محددة")}</span>
                  )}
                </span>
              </div>

              {isMmBomsFetching ? (
                <p className="px-2.5 py-2 text-xs text-gray-500">{translate("Loading...", "جاري التحميل...")}</p>
              ) : group.components.length === 0 ? (
                <p className="px-2.5 py-2 text-xs text-gray-500">
                  {translate("No components defined.", "لا توجد مكونات معرّفة.")}
                </p>
              ) : (
                <Table className="text-nowrap" horizontalSpacing="xs" fz="xs">
                  <Table.Thead className="bg-gray-50">
                    <Table.Tr>
                      <Table.Th className="py-2 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Material", "المادة")}
                      </Table.Th>
                      <Table.Th className="py-2 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
                        {translate("Total Qty Required", "إجمالي الكمية المطلوبة")}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {group.components.map((component) => (
                      <Table.Tr key={component.materialCode} className="text-gray-700">
                        <Table.Td className="flex gap-1.5">
                          <span className="text-xs font-medium text-gray-900">{component.materialTitle}</span>
                          <span className="text-xs text-gray-400">{component.materialCode}</span>
                        </Table.Td>
                        <Table.Td>
                          <span className="text-xs font-medium text-gray-700">
                            {getMaterialUnitLabel(component.unitOfMeasurement, locale)} {formatQuantity(component.quantityRequired)}
                          </span>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
