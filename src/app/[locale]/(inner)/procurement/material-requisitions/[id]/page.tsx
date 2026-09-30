"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Menu } from "@mantine/core";
import { Pencil, Plus } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { MaterialPurchaseRequisitionItemDetailed } from "@/types/material-purchase-requisition";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RequisitionApprovals from "./components/requisition-approvals";
import RequisitionDetails from "./components/requisition-details";
import RequisitionUpdateModal from "./components/requisition-update-modal";
import RequisitionItemModal from "./components/requisition-item-modal";
import RequisitionItemsTable from "./components/requisition-items-table";
import PrintDocument from "@/components/ui/print-document";
import MaterialPurchaseRequisitionPrintDocument from "@/components/documents/procurement/mpreqs/material-purchase-requisition-print-document";
import { getRequisitionStatus, isRequisitionEditable } from "../helpers";

const PAGE_TITLE = { en: "Requisition Details", ar: "تفاصيل طلب الشراء" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();
  const { helpers } = useMaterialCategories();
  const canAddOrder = useHasPermission(PERMISSIONS.ADD_MATERIAL_PURCHASE_ORDER);
  const canUpdateRequisition = useHasPermission(PERMISSIONS.UPDATE_MATERIAL_PURCHASE_REQUISITION);

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
  const canCreateOrder =
    !!requisition &&
    getRequisitionStatus(requisition) === "approved" &&
    requisition.items.some((item) => Number(item.quantityRemaining ?? 0) > 1e-9);

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
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <ActionsMenu>
              {requisition && (
                <PrintDocument
                  title={`${translate("Material Purchase Requisition", "طلب شراء خامات")} - ${requisition.code}`}
                  buttonLabel={translate("Print requisition", "طباعة طلب الشراء")}
                  buttonType="menu"
                  paperWidth={297}
                  paperHeight={210}
                  paperMarginX={14}
                  paperMarginTop={10}
                  paperMarginBottom={12}
                >
                  <MaterialPurchaseRequisitionPrintDocument
                    requisition={requisition}
                    getMainCategoryTitle={getMainCategoryTitle}
                  />
                </PrintDocument>
              )}
              {(canCreateOrder && canAddOrder) || (requisition && editable && canUpdateRequisition) ? (
                <Menu.Divider />
              ) : null}
              {canCreateOrder && canAddOrder && (
                <Menu.Item
                  component={Link}
                  href={getLocalizedHref(`/procurement/material-orders/create?requisitionId=${requisition!.id}`)}
                  leftSection={<Plus size={14} />}
                >
                  {translate("Create purchase order", "إنشاء أمر توريد")}
                </Menu.Item>
              )}
              {requisition && editable && canUpdateRequisition && (
                <Menu.Item leftSection={<Pencil size={14} />} onClick={openHeaderModal}>
                  {translate("Edit requisition", "تعديل طلب الشراء")}
                </Menu.Item>
              )}
            </ActionsMenu>
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

            <section className="mb-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

                <ActionsMenu>
                  {editable && canUpdateRequisition && (
                    <Menu.Item leftSection={<Plus size={14} />} onClick={handleAddItem}>
                      {translate("Add requisition item", "إضافة بند لطلب الشراء")}
                    </Menu.Item>
                  )}
                </ActionsMenu>
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

            <RequisitionApprovals requisition={requisition} />

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
