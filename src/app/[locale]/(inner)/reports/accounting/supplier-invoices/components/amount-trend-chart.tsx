"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table } from "@mantine/core";
import { TrendingUp } from "lucide-react";
import { localeDirections } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/hooks";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatCompactNumber } from "@/lib/helpers/format-compact-number";
import type { AccountingSupplierInvoicesByPeriod } from "@/types/reports";
import type { GroupBy } from "../../../purchasing-materials/components/date-range-filter";
import ReportCard from "../../components/report-card";
import { reportTheme } from "../../components/report-theme";
import { formatPeriodLabel } from "./period-label";

export default function AmountTrendChart({
  data,
  groupBy,
}: {
  data: AccountingSupplierInvoicesByPeriod[];
  groupBy: GroupBy;
}) {
  const { locale, translate, translation } = useI18n();
  const currency = translation.currency;
  const dir = localeDirections[locale];
  const isRtl = dir === "rtl";
  const chartData = data.map((row) => ({
    name: formatPeriodLabel(row.period, locale, groupBy),
    totalAmount: row.totalAmount,
  }));
  const totalInvoices = data.reduce((sum, row) => sum + row.invoiceCount, 0);
  const totalAmount = data.reduce((sum, row) => sum + row.totalAmount, 0);
  const percentageFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatShare(value: number) {
    return `${percentageFormatter.format(totalAmount === 0 ? 0 : (value / totalAmount) * 100)}%`;
  }

  return (
    <ReportCard
      title={translate("Invoice Total Trend", "اتجاه إجمالي الفاتورة")}
      description={translate(
        "Invoice totals grouped by issue date period.",
        "إجماليات الفواتير مجمعة حسب فترة تاريخ الإصدار.",
      )}
      icon={TrendingUp}
      accent="teal"
    >
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">{translate("No data available", "لا توجد بيانات")}</p>
      ) : (
        <div className="h-64" dir={dir}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} style={{ direction: "ltr" }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed={isRtl} />
              <YAxis
                tick={{ fontSize: 11 }}
                orientation={isRtl ? "right" : "left"}
                tickFormatter={formatCompactNumber}
                width={48}
              />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value ?? 0), currency), translate("Total", "الإجمالي")]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e7e5e4", direction: dir }}
              />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke={reportTheme.chart.period}
                strokeWidth={2}
                dot={{ r: 4, fill: reportTheme.chart.period }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {chartData.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl">
          <Table className="text-nowrap" verticalSpacing="sm" highlightOnHover>
            <Table.Thead className="bg-gray-50">
              <Table.Tr>
                <Table.Th className="text-gray-600">{translate("Period", "الفترة")}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Invoices", "الفواتير")}</Table.Th>
                <Table.Th className="text-gray-600">{translate(`Total (${currency})`, `الإجمالي (${currency})`)}</Table.Th>
                <Table.Th className="text-gray-600">{translate("Percentage", "النسبة")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((row) => (
                <Table.Tr key={row.period} className="text-gray-600">
                  <Table.Td className="font-medium text-gray-800">{formatPeriodLabel(row.period, locale, groupBy)}</Table.Td>
                  <Table.Td>{row.invoiceCount}</Table.Td>
                  <Table.Td className="font-semibold text-gray-800">{formatMoney(row.totalAmount)}</Table.Td>
                  <Table.Td>{formatShare(row.totalAmount)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot className="bg-gray-50">
              <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                <Table.Th>{translate("Total", "الإجمالي")}</Table.Th>
                <Table.Th>{totalInvoices}</Table.Th>
                <Table.Th>{formatMoney(totalAmount)}</Table.Th>
                <Table.Th>{formatShare(totalAmount)}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>
      )}
    </ReportCard>
  );
}
