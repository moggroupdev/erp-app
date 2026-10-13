"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseOrdersApi from "@/lib/api/material-purchase-orders";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import { materialPurchaseOrderUpdateBlock } from "../../helpers";
import OrderForm from "../../components/order-form";

const PAGE_TITLE = { en: "Edit Material Purchase Order", ar: "تعديل أمر توريد خامات" };

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();

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

  const receiptsParams = { materialPurchaseOrderId: id, limit: 1, sortBy: "-createdAt" };

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

  useDocumentTitle(
    `${order?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Orders", "أوامر توريد الخامات")}`,
  );

  const isFetching = isOrderFetching || isReceiptsFetching;
  const block = order ? materialPurchaseOrderUpdateBlock(order, (paginatedReceipts?.data.length ?? 0) > 0) : null;

  function goBack() {
    router.push(getLocalizedHref(`/procurement/material-orders/${id}`));
  }

  const blockMessage = {
    cancelled: translate("A cancelled purchase order cannot be updated.", "لا يمكن تحديث أمر توريد ملغى."),
    completed: translate("A completed purchase order cannot be updated.", "لا يمكن تحديث أمر توريد مكتمل."),
    receipt: translate(
      "A purchase order that already has a receipt cannot be updated.",
      "لا يمكن تحديث أمر توريد له سند استلام.",
    ),
    window: translate(
      "This purchase order can only be updated within one day of creation.",
      "يمكن تحديث أمر التوريد خلال يوم واحد فقط من إنشائه.",
    ),
  } as const;

  return (
    <div className="flex min-h-full flex-col gap-5">
      {isFetching && !order ? (
        <LoadingSection message={translate("Loading purchase order data", "جاري تحميل بيانات أمر التوريد")} />
      ) : orderError ? (
        <ErrorSection
          errorTitle={translate(
            "An error occurred while loading purchase order data",
            "حدث خطأ أثناء تحميل بيانات أمر التوريد",
          )}
          errorMessage={getErrorMessage(locale, orderError)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetchOrder() }}
        />
      ) : receiptsError ? (
        <ErrorSection
          errorTitle={translate("Error loading receipts", "خطأ في تحميل سندات الاستلام")}
          errorMessage={getErrorMessage(locale, receiptsError)}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetchReceipts() }}
        />
      ) : !order || isReceiptsFetching ? (
        <LoadingSection message={translate("Loading purchase order data", "جاري تحميل بيانات أمر التوريد")} />
      ) : block ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-gray-600">{blockMessage[block]}</p>
          <Button
            type="button"
            variant="light"
            color="dark"
            radius="md"
            leftSection={<ArrowLeft size={16} style={{ transform: `rotateY(${translate("0deg", "180deg")})` }} />}
            onClick={goBack}
          >
            {translation.back}
          </Button>
        </div>
      ) : (
        <OrderForm mode="edit" order={order} />
      )}
    </div>
  );
}
