"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@mantine/core";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import inventoryTransactionsApi from "@/lib/api/inventory-transactions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CopyButton from "@/components/ui/copy-button";
import TransactionDetails, { getItemSourceLabel, MaterialTitleLink } from "./components/transaction-details";

const PAGE_TITLE = { en: "Transaction Details", ar: "تفاصيل الحركة" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();

  const {
    data: transaction,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.inventoryTransactions.detail(id),
    queryFn: ({ signal }) => inventoryTransactionsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.inventoryTransactions,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useDocumentTitle(
    `${transaction?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Inventory Transactions", "حركات المخزون")}`,
  );

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/warehouse/transactions"),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading transaction data", "جاري تحميل بيانات الحركة")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading transaction data", "حدث خطأ أثناء تحميل بيانات الحركة")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        transaction && (
          <>
            <TransactionDetails transaction={transaction} />

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

              {transaction.items.length === 0 ? (
                <EmptySection message={translate("No items in this transaction", "لا توجد بنود في هذه الحركة")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{translate("Material", "المادة")}</Table.Th>
                        <Table.Th>{translate("Code", "الكود")}</Table.Th>
                        <Table.Th>{translate("Type", "النوع")}</Table.Th>
                        <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                        <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                        <Table.Th>
                          {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                        </Table.Th>
                        <Table.Th>{translate("Source", "المصدر")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {transaction.items.map((item) => (
                        <Table.Tr key={item.id} className="text-gray-600">
                          <Table.Td className="font-semibold text-gray-800">
                            <MaterialTitleLink code={item.material.code} title={item.material.title} />
                          </Table.Td>
                          <Table.Td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{item.material.code}</span>
                              <CopyButton text={item.material.code} />
                            </div>
                          </Table.Td>
                          <Table.Td>{getMaterialTypeLabel(item.material.materialType, locale)}</Table.Td>
                          <Table.Td>{getMaterialUnitLabel(item.material.unitOfMeasurement, locale)}</Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                          <Table.Td>{formatMoney(item.unitPrice)}</Table.Td>
                          <Table.Td>{getItemSourceLabel(item, translate)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </section>
          </>
        )
      )}
    </LayoutBox>
  );
}
