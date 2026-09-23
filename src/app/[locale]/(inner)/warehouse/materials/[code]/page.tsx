"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { isManufacturedMaterial, isRawMaterial } from "@/lib/constants/enums/material-types";
import { Button, Menu } from "@mantine/core";
import { ChevronDown, Pencil, Repeat, Tag } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import MaterialModal from "@/components/global/data-modals/material-modal";
import MaterialMarketPriceModal from "./components/material-market-price-modal";
import MaterialTypeModal from "./components/material-type-modal";
import MaterialDetails from "./components/material-details";
import MaterialBomSection from "./components/material-bom-section";
import MaterialBomUsagesSection from "./components/material-bom-usages-section";
import MaterialUnitConversionsSection from "./components/material-unit-conversions-section";
import MaterialQuickLinks from "./components/material-quick-links";

const PAGE_TITLE = { en: "Material Details", ar: "تفاصيل المادة" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { code } = useParams<{ code: string }>();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canReadBom = useHasPermission(PERMISSIONS.READ_MANUFACTURED_MATERIAL_BOMS);
  const canReadProductBoms = useHasPermission(PERMISSIONS.READ_PRODUCT_BOMS);
  const canUpdateMaterial = useHasPermission(PERMISSIONS.UPDATE_MATERIAL);
  const canSetMarketPrice = useHasPermission(PERMISSIONS.SET_MATERIAL_MARKET_PRICE);
  const canSetMaterialType = useHasPermission(PERMISSIONS.SET_MATERIAL_TYPE);
  const canManageMaterial = canUpdateMaterial || canSetMarketPrice || canSetMaterialType;

  const materialQuery = useQuery({
    queryKey: queryKeys.materials.detail(code),
    queryFn: ({ signal }) => materialsApi.get({ privateRequest, code, signal }),
    staleTime: staleTimes.materials,
  });

  const material = materialQuery.data || null;
  const shouldLoadBom = canReadBom && !!material && isManufacturedMaterial(material.materialType);

  const bomQuery = useQuery({
    queryKey: queryKeys.mmBoms.detail(code),
    queryFn: ({ signal }) => mmBomsApi.getByMaterial({ privateRequest, manufacturedMaterialCode: code, signal }),
    staleTime: staleTimes.mmBoms,
    enabled: shouldLoadBom,
  });

  const loading = materialQuery.isFetching || (shouldLoadBom && bomQuery.isFetching);
  const queryError = materialQuery.error || (shouldLoadBom ? bomQuery.error : null);
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";
  // Keep existing content mounted during refetch so nested usage queries are not unmounted mid-invalidate (which would refetch twice).
  const showPageLoader = loading && !material;

  useDocumentTitle(`${material?.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Materials", "المواد")}`);

  function handleRetry() {
    materialQuery.refetch();
    if (shouldLoadBom) bomQuery.refetch();
    if (canReadProductBoms) queryClient.invalidateQueries({ queryKey: queryKeys.boms.usages(code) });
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [marketPriceModalOpened, { open: openMarketPriceModal, close: closeMarketPriceModal }] = useDisclosure(false);
  const [typeModalOpened, { open: openTypeModal, close: closeTypeModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {material && canManageMaterial && (
              <Menu offset={8} withinPortal withArrow>
                <Menu.Target>
                  <Button variant="light" color="teal" radius="md" rightSection={<ChevronDown size={14} />}>
                    {translate("Actions", "الإجراءات")}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {canUpdateMaterial && (
                    <Menu.Item leftSection={<Pencil size={14} />} onClick={openUpdateModal}>
                      {translate("Edit", "تعديل")}
                    </Menu.Item>
                  )}
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
                </Menu.Dropdown>
              </Menu>
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
            />

            <MaterialTypeModal opened={typeModalOpened} close={closeTypeModal} material={material} />

            <MaterialDetails material={material} />

            {isRawMaterial(material.materialType) && <MaterialUnitConversionsSection material={material} />}

            {isManufacturedMaterial(material.materialType) && (
              <MaterialBomSection material={material} bom={bomQuery.data || null} />
            )}

            <MaterialBomUsagesSection material={material} />

            <MaterialQuickLinks materialCode={code} />
          </>
        )
      )}
    </LayoutBox>
  );
}
