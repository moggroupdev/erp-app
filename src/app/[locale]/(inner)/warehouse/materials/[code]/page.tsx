"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@mantine/core";
import { Pencil, Tag } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import MaterialModal from "@/components/global/data-modals/material-modal";
import MaterialMarketPriceModal from "./components/material-market-price-modal";
import MaterialDetails from "./components/material-details";
import MaterialBomSection from "./components/material-bom-section";
import MaterialUnitConversionsSection from "./components/material-unit-conversions-section";
import MaterialQuickLinks from "./components/material-quick-links";

const PAGE_TITLE = { en: "Material Details", ar: "تفاصيل المادة" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { code } = useParams<{ code: string }>();
  const privateRequest = usePrivateRequest();
  const canReadBom = useHasPermission(PERMISSIONS.READ_MANUFACTURED_MATERIAL_BOMS);

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

  useDocumentTitle(`${material?.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Materials", "المواد")}`);

  function handleRetry() {
    materialQuery.refetch();
    if (shouldLoadBom) bomQuery.refetch();
  }

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [marketPriceModalOpened, { open: openMarketPriceModal, close: closeMarketPriceModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {material && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL}>
                <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
                  {translate("Edit", "تعديل")}
                </Button>
              </PermissionGuard>
            )}
            {material && (
              <PermissionGuard permission={PERMISSIONS.SET_MATERIAL_MARKET_PRICE}>
                <Button onClick={openMarketPriceModal} variant="light" color="teal" radius="md" leftSection={<Tag size={15} />}>
                  {translate("Set Market Price", "تعيين سعر السوق")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      }}
    >
      {loading ? (
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

            <MaterialDetails material={material} />

            {isRawMaterial(material.materialType) && <MaterialUnitConversionsSection material={material} />}

            {isManufacturedMaterial(material.materialType) && (
              <MaterialBomSection material={material} bom={bomQuery.data || null} />
            )}

            <MaterialQuickLinks materialCode={code} />
          </>
        )
      )}
    </LayoutBox>
  );
}
