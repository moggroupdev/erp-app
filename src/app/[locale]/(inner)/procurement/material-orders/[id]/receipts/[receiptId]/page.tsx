"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button, Table } from "@mantine/core";
import { ClipboardCheck } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { toDisplayQuantity, toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import LayoutBox from "@/components/ui/layout-box";
import UnitToggle from "@/components/ui/unit-toggle";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CopyButton from "@/components/ui/copy-button";
import ReceiptDetails from "./components/receipt-details";
import InspectionReportModal from "./components/inspection-report-modal";

const PAGE_TITLE = { en: "Materials Receipt Details", ar: "سند استلام خامات" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { id: orderId, receiptId } = useParams<{ id: string; receiptId: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();
  const { helpers } = useMaterialCategories();

  const [inspectionModalOpened, { open: openInspectionModal, close: closeInspectionModal }] = useDisclosure(false);

  function getMainCategoryTitle(subCategoryId: string) {
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return main?.title || "-";
  }

  const {
    data: receipt,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseOrders.receipts.detail(receiptId),
    queryFn: ({ signal }) => materialPurchaseOrdersApi.getReceipt({ privateRequest, id: receiptId, signal }),
    staleTime: staleTimes.materialPurchaseOrders,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useDocumentTitle(
    `${receipt?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Orders", "أوامر شراء الخامات")}`,
  );

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref(`/procurement/material-orders/${orderId}`),
        sideElements: (
          <div className="flex items-center gap-2">
            {receipt && receipt.items.length > 0 && (
              <Button
                variant="light"
                color="cyan"
                radius="md"
                leftSection={<ClipboardCheck size={15} />}
                onClick={openInspectionModal}
              >
                {translate("Inspection Report", "محضر الفحص")}
              </Button>
            )}
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
          </div>
        ),
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading receipt data", "جاري تحميل بيانات إذن الاستلام")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading receipt data", "حدث خطأ أثناء تحميل بيانات إذن الاستلام")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        receipt && (
          <>
            <ReceiptDetails receipt={receipt} />

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

              {receipt.items.length === 0 ? (
                <EmptySection message={translate("No items in this receipt", "لا توجد بنود في إذن الاستلام هذا")} />
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
                        <Table.Th>{translate("Quantity Received", "الكمية المستلمة")}</Table.Th>
                        <Table.Th>{translate("Quantity Rejected", "الكمية المرفوضة")}</Table.Th>
                        <Table.Th>
                          {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                        </Table.Th>
                        <Table.Th>
                          {translate(`Subtotal (${translation.currency})`, `المجموع الفرعي (${translation.currency})`)}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {receipt.items.map((item) => {
                        const { material, quantityOrdered, unitPrice } = item.materialPurchaseOrderItem;
                        const subtotal = Number(item.quantityReceived) * Number(unitPrice);
                        return (
                          <UnitToggle
                            key={item.id}
                            baseUnit={material.unitOfMeasurement}
                            unitConversions={material.unitConversions}
                          >
                            {({ unit, factor, toggleButton }) => (
                          <Table.Tr className="text-gray-600">
                            <Table.Td className="font-semibold text-gray-800">
                              <Link
                                href={getLocalizedHref(`/warehouse/materials/${material.code}`)}
                                className="hover:underline"
                              >
                                {material.title}
                              </Link>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono">{material.code}</span>
                                <CopyButton text={material.code} />
                              </div>
                            </Table.Td>
                            <Table.Td>{getMainCategoryTitle(material.subCategoryId)}</Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1">
                                {getMaterialUnitLabel(unit, locale)}
                                {toggleButton}
                              </div>
                            </Table.Td>
                            <Table.Td>{toDisplayQuantity(quantityOrdered, factor)}</Table.Td>
                            <Table.Td>{toDisplayQuantity(item.quantityReceived, factor)}</Table.Td>
                            <Table.Td>{toDisplayQuantity(item.quantityRejected, factor)}</Table.Td>
                            <Table.Td>{formatMoney(toDisplayUnitPrice(unitPrice, factor))}</Table.Td>
                            <Table.Td className="font-semibold text-gray-800">{formatMoney(subtotal)}</Table.Td>
                          </Table.Tr>
                            )}
                          </UnitToggle>
                        );
                      })}
                    </Table.Tbody>
                    <Table.Tfoot className="bg-gray-50">
                      <Table.Tr className="h-10 border-t border-b-0! border-gray-200 text-gray-700">
                        <Table.Th colSpan={8}>{translate("Total", "الإجمالي")}</Table.Th>
                        <Table.Th>
                          {formatMoney(
                            receipt.items.reduce(
                              (sum, item) =>
                                sum + Number(item.quantityReceived) * Number(item.materialPurchaseOrderItem.unitPrice),
                              0,
                            ),
                          )}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Tfoot>
                  </Table>
                </div>
              )}
            </section>

            <InspectionReportModal opened={inspectionModalOpened} onClose={closeInspectionModal} items={receipt.items} />
          </>
        )
      )}
    </LayoutBox>
  );
}
