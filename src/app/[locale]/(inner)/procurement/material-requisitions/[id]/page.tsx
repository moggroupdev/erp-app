"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button } from "@mantine/core";
import { Pencil, Plus } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RequisitionDetails from "./components/requisition-details";
import RequisitionUpdateModal from "./components/requisition-update-modal";
import RequisitionItemModal from "./components/requisition-item-modal";
import RequisitionItemsTable from "./components/requisition-items-table";
import { isRequisitionEditable } from "../helpers";

const PAGE_TITLE = { en: "Requisition Details", ar: "تفاصيل طلب الشراء" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();
  const { helpers } = useMaterialCategories();

  const [headerModalOpened, { open: openHeaderModal, close: closeHeaderModal }] = useDisclosure(false);
  const [itemModalOpened, { open: openItemModal, close: closeItemModal }] = useDisclosure(false);
  const [itemToUpdate, setItemToUpdate] = useState<MaterialPurchaseRequisitionItemDetailed | null>(null);

  function getMainCategoryTitle(subCategoryId: string | undefined) {
    if (!subCategoryId) return null;
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return main?.title || null;
  }

  const {
    data: requisition,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseRequisitions.detail(id),
    queryFn: ({ signal }) => materialPurchaseRequisitionsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.materialPurchaseRequisitions,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const editable = requisition ? isRequisitionEditable(requisition) : false;

  useDocumentTitle(
    `${requisition?.code || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Material Purchase Requisitions", "طلبات شراء الخامات")}`,
  );

  function handleAddItem() {
    setItemToUpdate(null);
    openItemModal();
  }

  function handleEditItem(item: MaterialPurchaseRequisitionItemDetailed) {
    setItemToUpdate(item);
    openItemModal();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/procurement/material-requisitions"),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            {requisition && editable && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL_PURCHASE_REQUISITION}>
                <Button onClick={openHeaderModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
                  {translate("Edit", "تعديل")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading requisition data", "جاري تحميل بيانات طلب الشراء")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading requisition data", "حدث خطأ أثناء تحميل بيانات طلب الشراء")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        requisition && (
          <>
            <RequisitionDetails requisition={requisition} />

            <section className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

                {editable && (
                  <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL_PURCHASE_REQUISITION}>
                    <Button onClick={handleAddItem} variant="light" radius="md" leftSection={<Plus size={15} />}>
                      {translate("Add Item", "إضافة بند")}
                    </Button>
                  </PermissionGuard>
                )}
              </div>

              {requisition.items.length === 0 ? (
                <EmptySection message={translate("No items in this requisition", "لا توجد بنود في هذا الطلب")} />
              ) : (
                <RequisitionItemsTable
                  requisitionId={requisition.id}
                  items={requisition.items}
                  editable={editable}
                  getMainCategoryTitle={getMainCategoryTitle}
                  onEdit={handleEditItem}
                />
              )}
            </section>

            {editable && (
              <>
                <RequisitionUpdateModal opened={headerModalOpened} close={closeHeaderModal} requisition={requisition} />
                <RequisitionItemModal
                  opened={itemModalOpened}
                  close={closeItemModal}
                  requisitionId={requisition.id}
                  itemToUpdate={itemToUpdate}
                  setItemToUpdate={setItemToUpdate}
                  excludeMaterialCodes={requisition.items.map((item) => item.materialCode)}
                />
              </>
            )}
          </>
        )
      )}
    </LayoutBox>
  );
}
