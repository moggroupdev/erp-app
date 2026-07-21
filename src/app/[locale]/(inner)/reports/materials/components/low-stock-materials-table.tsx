"use client";

import Link from "next/link";
import { Alert, Table } from "@mantine/core";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { MaterialsInventoryLowStockMaterial } from "@/types/reports";
import ReportCard from "./report-card";

export default function LowStockMaterialsTable({ data }: { data: MaterialsInventoryLowStockMaterial[] }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <ReportCard
      title={translate("Materials Below Minimum", "مواد دون حد الطلب")}
      description={translate(
        "Materials at or below their configured minimum stock, ordered by largest deficit first.",
        "المواد التي بلغت أو تجاوزت الحد الأدنى للمخزون، مرتبة حسب أكبر عجز أولاً.",
      )}
      icon={AlertCircle}
      accent="amber"
    >
      {data.length === 0 ? (
        <Alert
          color="teal"
          icon={<CheckCircle2 size={20} />}
          title={translate("No replenishment needed", "لا حاجة للتزويد")}
          variant="light"
          radius="lg"
        >
          {translate(
            "All materials with a minimum stock level are currently above their threshold.",
            "جميع المواد التي لها حد أدنى للمخزون تقع حالياً فوق العتبة المحددة.",
          )}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-stone-50">
              <Table.Tr>
                <Table.Th className="text-stone-600">{translate("Title", "العنوان")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Qty", "الكمية")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Minimum", "حد الطلب")}</Table.Th>
                <Table.Th className="text-stone-600">{translate("Deficit", "العجز")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((material) => (
                <Table.Tr key={material.code} className="text-stone-600">
                  <Table.Td className="max-w-[240px] truncate font-medium text-stone-800">
                    <Link
                      href={getLocalizedHref(`/warehouse/materials/${material.code}`)}
                      className="text-gray-800 hover:underline"
                      title={material.title}
                    >
                      {material.title}
                    </Link>
                  </Table.Td>
                  <Table.Td className="font-mono text-xs text-stone-500">{material.code}</Table.Td>
                  <Table.Td>{material.quantity}</Table.Td>
                  <Table.Td>{material.minimumStock}</Table.Td>
                  <Table.Td className="font-semibold text-amber-700">{material.deficit}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
