"use client";

import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Table } from "@mantine/core";
import { AlertTriangle, History } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import { useI18n } from "@/lib/i18n/hooks";
import { getMaterialUnitLabel, type MaterialUnit } from "@/lib/constants/enums/material-units";
import type { Locale } from "@/lib/i18n/types";
import {
  getPriceOutlierCauseLabel,
  type PriceOutlierCause,
} from "@/lib/constants/enums/derived/price-outlier-causes";
import { getSemanticStatusColors } from "@/lib/constants/status-colors";
import { formatMoney } from "@/lib/helpers/format-money";
import type { PurchasingMaterialsPriceOutlierRow } from "@/types/reports";
import ReportCard from "../../components/report-card";

export default function PriceOutliersTable({
  data,
  emptyMessage,
}: {
  data: PurchasingMaterialsPriceOutlierRow[];
  emptyMessage: string;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;

  return (
    <ReportCard
      title={translate("Flagged purchase lines", "بنود الشراء المعلمة")}
      description={translate(
        "Each line is compared with the median of nearby purchases of the same material. Open the price history or the purchase order to review it.",
        "يُقارن كل بند بوسيط المشتريات المجاورة لنفس المادة. افتح تاريخ الأسعار أو أمر التوريد للمراجعة.",
      )}
      icon={AlertTriangle}
      accent="rose"
    >
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">#</Table.Th>
                <Table.Th className="text-gray-600">{translate("Material", "المادة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Code", "الكود")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("MPO Number", "رقم أمر التوريد")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoice Number", "رقم الفاتورة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Date", "التاريخ")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Supplier", "المورد")}</Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Entered price (${currency})`, `السعر المدخل (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">
                  {translate(`Neighbour median (${currency})`, `وسيط الجوار (${currency})`)}
                </Table.Th>
                <Table.Th className="text-gray-600">{translate("Ratio", "النسبة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Likely cause", "السبب المحتمل")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row, index) => (
                <Table.Tr key={row.itemId} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-400">{index + 1}</Table.Td>
                  <Table.Td>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIALS}
                        href={`/warehouse/materials/${row.materialCode}`}
                        className="max-w-56 truncate font-medium text-gray-800 hover:underline"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </ProtectedLink>
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIAL_PURCHASING_PRICE_HISTORY_REPORT}
                        href={`/reports/purchasing-materials/price-history?materialCode=${row.materialCode}`}
                        className="shrink-0 text-gray-400 hover:text-haze-700"
                        title={translate("Price history", "تاريخ الأسعار")}
                      >
                        <History size={14} />
                      </ProtectedLink>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-gray-500">{row.materialCode}</span>
                      <CopyButton text={row.materialCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className="flex items-center gap-1.5">
                      <ProtectedLink
                        permission={PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS}
                        href={`/procurement/material-orders/${row.orderId}`}
                        className="font-mono font-medium text-gray-800 hover:underline"
                      >
                        {row.orderCode}
                      </ProtectedLink>
                      <CopyButton text={row.orderCode} />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {row.invoiceNumbers?.length ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-gray-600">{row.invoiceNumbers.join(", ")}</span>
                        <CopyButton text={row.invoiceNumbers.join(", ")} />
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {new Date(row.orderDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Table.Td>
                  <Table.Td>
                    <ProtectedLink
                      permission={PERMISSIONS.READ_SUPPLIERS}
                      href={`/procurement/suppliers/${row.supplierId}`}
                      className="text-gray-800 hover:underline"
                    >
                      {row.supplierName}
                    </ProtectedLink>
                  </Table.Td>
                  <Table.Td>
                    <PriceWithUnit amount={row.enteredUnitPrice} unit={row.enteredUnit} locale={locale} />
                  </Table.Td>
                  <Table.Td>
                    {row.referenceMedian == null ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <PriceWithUnit amount={row.referenceMedian} unit={row.enteredUnit} locale={locale} />
                    )}
                  </Table.Td>
                  <Table.Td className="font-medium text-gray-800">{formatRatio(row.ratio)}</Table.Td>
                  <Table.Td>
                    <CauseBadge cause={row.cause} label={getPriceOutlierCauseLabel(row.cause, locale)} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}

function PriceWithUnit({ amount, unit, locale }: { amount: number; unit: MaterialUnit; locale: Locale }) {
  return (
    <>
      {formatMoney(amount)}
      <span className="ms-1 text-xs text-gray-400">/ {getMaterialUnitLabel(unit, locale)}</span>
    </>
  );
}

function formatRatio(ratio: number | null) {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return "-";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio);
  return `x${formatted}`;
}

function CauseBadge({ cause, label }: { cause: PriceOutlierCause; label: string }) {
  const colors =
    cause === "missing_conversion"
      ? { textClass: "text-gray-700", surfaceClass: "bg-gray-50", borderClass: "border-gray-200" }
      : getSemanticStatusColors(cause === "spike" ? "warning" : "danger");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.surfaceClass} ${colors.textClass}`}>
      {label}
    </span>
  );
}
