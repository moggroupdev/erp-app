"use client";

import { useParams } from "next/navigation";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import materialsApi from "@/lib/api/materials";
import mmBomsApi from "@/lib/api/mm-boms";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { isManufacturedMaterial, supportsUnitConversions } from "@/lib/constants/enums/material-types";
import { Menu } from "@mantine/core";
import { ArchiveRestore, Factory, Merge, Pencil, Repeat, Tag, Trash2 } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import PermissionGuard from "@/components/guards/permission";
import MaterialModal from "@/components/global/data-modals/material-modal";
import MaterialMarketPriceModal from "./components/material-market-price-modal";
import MaterialMarketManufacturingCostModal from "./components/material-market-manufacturing-cost-modal";
import MaterialTypeModal from "./components/material-type-modal";
import DeleteMaterialModal from "./components/delete-material-modal";
import MergeMaterialModal from "./components/merge-material-modal";
import RestoreMaterialModal from "../components/restore-material-modal";
import MaterialDetails from "./components/material-details";
import MaterialBomSection from "./components/material-bom-section";
import MaterialBomUsagesSection from "./components/material-bom-usages-section";
import MaterialUnitConversionsSection from "./components/material-unit-conversions-section";
import MaterialChangeHistorySection from "./components/material-change-history-section";
import MaterialQuickLinks from "./components/material-quick-links";

const PAGE_TITLE = { en: "Material Details", ar: "تفاصيل المادة" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { code } = useParams<{ code: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canReadBom = useHasPermission(PERMISSIONS.READ_MANUFACTURED_MATERIAL_BOMS);
  const canReadProductBoms = useHasPermission(PERMISSIONS.READ_PRODUCT_BOMS);
  const canReadAuditLogs = useHasPermission(PERMISSIONS.READ_AUDIT_LOGS);
  const canUpdateMaterial = useHasPermission(PERMISSIONS.UPDATE_MATERIAL);
  const canDeleteMaterial = useHasPermission(PERMISSIONS.DELETE_MATERIAL);
  const canRestoreMaterial = useHasPermission(PERMISSIONS.RESTORE_MATERIAL);
  const canMergeMaterials = useHasPermission(PERMISSIONS.MERGE_MATERIALS);
  const canSetMarketPrice = useHasPermission(PERMISSIONS.SET_MATERIAL_MARKET_PRICE);
  const canSetMaterialType = useHasPermission(PERMISSIONS.SET_MATERIAL_TYPE);
  const canReadLastPurchasePrice = useHasPermission(PERMISSIONS.READ_MATERIAL_PURCHASE_ORDERS);

  const materialQuery = useQuery({
    queryKey: queryKeys.materials.detail(code),
    queryFn: ({ signal }) => materialsApi.get({ privateRequest, code, signal }),
    staleTime: staleTimes.materials,
  });

  const material = materialQuery.data || null;
  const isDeleted = !!material?.deletedAt;
  const shouldLoadBom = canReadBom && !!material && isManufacturedMaterial(material.materialType);
  const bomQuery = useQuery({
    queryKey: queryKeys.mmBoms.detail(code),
    queryFn: ({ signal }) => mmBomsApi.getByMaterial({ privateRequest, manufacturedMaterialCode: code, signal }),
    staleTime: staleTimes.mmBoms,
    enabled: shouldLoadBom,
  });

  const lastPurchasePriceQuery = useQuery({
    queryKey: queryKeys.materials.lastPurchasePrice(code),
    queryFn: ({ signal }) => materialsApi.getLastPurchasePrice({ privateRequest, code, signal }),
    staleTime: staleTimes.materials,
    enabled: canReadLastPurchasePrice,
  });

  const changeHistoryFetching = useIsFetching({
    queryKey: queryKeys.materials.changeHistories(code),
  });

  const loading =
    materialQuery.isFetching ||
    (shouldLoadBom && bomQuery.isFetching) ||
    (canReadLastPurchasePrice && lastPurchasePriceQuery.isFetching) ||
    (canReadAuditLogs && changeHistoryFetching > 0);
  const queryError = materialQuery.error || (shouldLoadBom ? bomQuery.error : null);
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";
  // Keep existing content mounted during refetch so nested usage queries are not unmounted mid-invalidate (which would refetch twice).
  const showPageLoader = loading && !material;

  useDocumentTitle(`${material?.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Materials", "المواد")}`);

  function handleRetry() {
    materialQuery.refetch();
    if (shouldLoadBom) bomQuery.refetch();
    if (canReadLastPurchasePrice) lastPurchasePriceQuery.refetch();
    if (canReadProductBoms) queryClient.invalidateQueries({ queryKey: queryKeys.boms.usages(code) });
    if (canReadAuditLogs) queryClient.invalidateQueries({ queryKey: queryKeys.materials.changeHistories(code) });
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [marketPriceModalOpened, { open: openMarketPriceModal, close: closeMarketPriceModal }] = useDisclosure(false);
  const [
    marketManufacturingCostModalOpened,
    { open: openMarketManufacturingCostModal, close: closeMarketManufacturingCostModal },
  ] = useDisclosure(false);
  const [typeModalOpened, { open: openTypeModal, close: closeTypeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [mergeModalOpened, { open: openMergeModal, close: closeMergeModal }] = useDisclosure(false);
  const [restoreModalOpened, { open: openRestoreModal, close: closeRestoreModal }] = useDisclosure(false);

  const showActiveActionsMenu =
    !isDeleted &&
    (canUpdateMaterial || canDeleteMaterial || canMergeMaterials || canSetMaterialType || canSetMarketPrice);
  const showDeletedActionsMenu = isDeleted && canRestoreMaterial;
  const showActionsMenu = showActiveActionsMenu || showDeletedActionsMenu;

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {material && showActionsMenu && (
              <ActionsMenu>
                {isDeleted ? (
                  canRestoreMaterial && (
                    <Menu.Item color="teal" leftSection={<ArchiveRestore size={14} />} onClick={openRestoreModal}>
                      {translate("Restore item", "استعادة الصنف")}
                    </Menu.Item>
                  )
                ) : (
                  <>
                    {canUpdateMaterial && (
                      <Menu.Item leftSection={<Pencil size={14} />} onClick={openUpdateModal}>
                        {translate("Edit material", "تعديل المادة")}
                      </Menu.Item>
                    )}
                    {(canSetMaterialType || canSetMarketPrice) && (
                      <>
                        {canUpdateMaterial && <Menu.Divider />}
                        {canSetMaterialType && (
                          <Menu.Item leftSection={<Repeat size={14} />} onClick={openTypeModal}>
                            {translate("Change Material Type", "تغيير نوع المادة")}
                          </Menu.Item>
                        )}
                        {canSetMarketPrice && (
                          <Menu.Item leftSection={<Tag size={14} />} onClick={openMarketPriceModal}>
                            {translate("Set Market Price", "تعيين سعر السوق")}
                          </Menu.Item>
                        )}
                        {canSetMarketPrice && isManufacturedMaterial(material.materialType) && (
                          <Menu.Item leftSection={<Factory size={14} />} onClick={openMarketManufacturingCostModal}>
                            {translate("Set Market Manufacturing Cost", "تعيين تكلفة التصنيع السوقية")}
                          </Menu.Item>
                        )}
                      </>
                    )}
                    {canMergeMaterials && (
                      <>
                        {(canUpdateMaterial || canSetMaterialType || canSetMarketPrice) && <Menu.Divider />}
                        <Menu.Item leftSection={<Merge size={14} />} onClick={openMergeModal}>
                          {translate("Merge duplicate into this item", "دمج صنف مكرر في هذا الصنف")}
                        </Menu.Item>
                      </>
                    )}
                    {canDeleteMaterial && (
                      <>
                        {(canUpdateMaterial || canSetMaterialType || canSetMarketPrice || canMergeMaterials) && (
                          <Menu.Divider />
                        )}
                        <Menu.Item color="clay" leftSection={<Trash2 size={14} />} onClick={openDeleteModal}>
                          {translate("Delete item", "حذف الصنف")}
                        </Menu.Item>
                      </>
                    )}
                  </>
                )}
              </ActionsMenu>
            )}
          </div>
        ),
      }}
    >
      {showPageLoader ? (
        <LoadingSection message={translate("Loading material data", "جاري تحميل ملف المادة")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading material data", "حدث خطأ أثناء تحميل ملف المادة")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        material && (
          <>
            <MaterialModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              materialToUpdate={material}
              setMaterialToUpdate={() => {}}
              isForList={false}
            />

            <MaterialMarketPriceModal
              opened={marketPriceModalOpened}
              close={closeMarketPriceModal}
              materialCode={code}
              currentValue={material.marketUnitPrice}
              baseUnit={material.unitOfMeasurement}
              unitConversions={material.unitConversions}
            />

            {isManufacturedMaterial(material.materialType) && (
              <MaterialMarketManufacturingCostModal
                opened={marketManufacturingCostModalOpened}
                close={closeMarketManufacturingCostModal}
                materialCode={code}
                currentValue={material.marketManufacturingCost}
                baseUnit={material.unitOfMeasurement}
                unitConversions={material.unitConversions}
              />
            )}

            <MaterialTypeModal opened={typeModalOpened} close={closeTypeModal} material={material} />

            <DeleteMaterialModal opened={deleteModalOpened} close={closeDeleteModal} material={material} />

            <MergeMaterialModal opened={mergeModalOpened} close={closeMergeModal} material={material} />

            <RestoreMaterialModal
              opened={restoreModalOpened}
              close={closeRestoreModal}
              material={{ code: material.code, title: material.title }}
            />

            <MaterialDetails
              material={material}
              lastPurchasePrice={canReadLastPurchasePrice ? (lastPurchasePriceQuery.data ?? null) : undefined}
            />

            {supportsUnitConversions(material.materialType) && <MaterialUnitConversionsSection material={material} />}

            {isManufacturedMaterial(material.materialType) && (
              <MaterialBomSection material={material} bom={bomQuery.data || null} />
            )}

            <MaterialBomUsagesSection material={material} />

            <PermissionGuard permission={PERMISSIONS.READ_AUDIT_LOGS}>
              <MaterialChangeHistorySection materialCode={code} />
            </PermissionGuard>

            <MaterialQuickLinks materialCode={code} />
          </>
        )
      )}
    </LayoutBox>
  );
}
