"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@mantine/core";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CopyButton from "@/components/ui/copy-button";
import OrderDetails from "./components/order-details";

const PAGE_TITLE = { en: "Purchase Order Details", ar: "تفاصيل أمر الشراء" };

const RECEIPTS_LIMIT = 100;

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();
  const { helpers } = useMaterialCategories();

  function getMainCategoryTitle(subCategoryId: string) {
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return main?.title || "-";
  }

  const {
    data: order,
    isFetching: isOrderFetching,
    error: orderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseOrders.detail(id),
    queryFn: ({ signal }) => materialPurchaseOrdersApi.getOrder({ privateRequest, id, signal }),
    staleTime: staleTimes.materialPurchaseOrders,
  });

  const receiptsParams = { materialPurchaseOrderId: id, limit: RECEIPTS_LIMIT, sortBy: "-createdAt" };

  const {
    data: paginatedReceipts,
    isFetching: isReceiptsFetching,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseOrders.receipts.list(receiptsParams),
    queryFn: ({ signal }) => materialPurchaseOrdersApi.listReceipts({ privateRequest, params: receiptsParams, signal }),
    staleTime: staleTimes.materialPurchaseOrders,
  });

  const isFetching = isOrderFetching || isReceiptsFetching;

  function refetch() {
    refetchOrder();
    refetchReceipts();
  }

  useDocumentTitle(
    `${order?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Orders", "أوامر شراء الخامات")}`,
  );

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/procurement/material-orders"),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={refetch} />,
      }}
    >
      {isOrderFetching ? (
        <LoadingSection message={translate("Loading purchase order data", "جاري تحميل بيانات أمر الشراء")} />
      ) : orderError ? (
        <ErrorSection
          errorTitle={translate(
            "An error occurred while loading purchase order data",
            "حدث خطأ أثناء تحميل بيانات أمر الشراء",
          )}
          errorMessage={getErrorMessage(locale, orderError)}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetchOrder() }}
        />
      ) : (
        order && (
          <>
            <OrderDetails order={order} />

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

              {order.items.length === 0 ? (
                <EmptySection message={translate("No items in this order", "لا توجد بنود في هذا الأمر")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{translate("Material", "المادة")}</Table.Th>
                        <Table.Th>{translate("Code", "الكود")}</Table.Th>
                        <Table.Th>{translate("Category", "الفئة")}</Table.Th>
                        <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                        <Table.Th>{translate("Quantity Ordered", "الكمية المطلوبة")}</Table.Th>
                        <Table.Th>
                          {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                        </Table.Th>
                        <Table.Th>
                          {translate(`Subtotal (${translation.currency})`, `المجموع الفرعي (${translation.currency})`)}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {order.items.map((item) => {
                        const subtotal = Number(item.quantityOrdered) * Number(item.unitPrice);
                        return (
                          <Table.Tr key={item.id} className="text-gray-600">
                            <Table.Td className="font-semibold text-gray-800">
                              <Link
                                href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)}
                                className="hover:underline"
                              >
                                {item.material.title}
                              </Link>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono">{item.material.code}</span>
                                <CopyButton text={item.material.code} />
                              </div>
                            </Table.Td>
                            <Table.Td>{getMainCategoryTitle(item.material.subCategoryId)}</Table.Td>
                            <Table.Td>{getMaterialUnitLabel(item.material.unitOfMeasurement, locale)}</Table.Td>
                            <Table.Td>{item.quantityOrdered}</Table.Td>
                            <Table.Td>{formatMoney(item.unitPrice)}</Table.Td>
                            <Table.Td className="font-semibold text-gray-800">{formatMoney(subtotal)}</Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                    <Table.Tfoot className="bg-gray-50">
                      <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                        <Table.Th colSpan={6}>{translate("Total", "الإجمالي")}</Table.Th>
                        <Table.Th>{formatMoney(order.totalAmount)}</Table.Th>
                      </Table.Tr>
                    </Table.Tfoot>
                  </Table>
                </div>
              )}
            </section>

            <section className="mt-8 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Receipts", "إذونات الاستلام")}</h4>

              {isReceiptsFetching ? (
                <LoadingSection message={translate("Loading receipts...", "جاري تحميل إذونات الاستلام...")} />
              ) : receiptsError ? (
                <ErrorSection
                  errorTitle={translate("Error loading receipts", "خطأ في تحميل إذونات الاستلام")}
                  errorMessage={getErrorMessage(locale, receiptsError)}
                  button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetchReceipts() }}
                />
              ) : !paginatedReceipts || paginatedReceipts.data.length === 0 ? (
                <EmptySection message={translate("No receipts for this order", "لا توجد إذونات استلام لهذا الأمر")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{translate("Code", "الكود")}</Table.Th>
                        <Table.Th>{translate("Received At", "تاريخ الاستلام")}</Table.Th>
                        <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                        <Table.Th>{translate("Date", "التاريخ")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedReceipts.data.map((receipt) => (
                        <Table.Tr key={receipt.id} className="text-gray-600">
                          <Table.Td className="font-semibold text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={getLocalizedHref(`/procurement/material-orders/${id}/receipts/${receipt.id}`)}
                                className="font-mono hover:underline"
                              >
                                {receipt.code}
                              </Link>
                              <CopyButton text={receipt.code} />
                            </div>
                          </Table.Td>
                          <Table.Td>
                            {receipt.receivedAt ? (
                              formatDateAndTime(receipt.receivedAt, locale)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </Table.Td>
                          <Table.Td className="max-w-xs truncate">
                            {receipt.notes || <span className="text-gray-400">-</span>}
                          </Table.Td>
                          <Table.Td>{formatDateAndTime(receipt.createdAt, locale)}</Table.Td>
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
