"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { useDisclosure } from "@mantine/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { isManufactured } from "@/lib/constants/enums/product-source-types";
import { Button, Menu } from "@mantine/core";
import { ChevronDown, Pencil, Tag } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import ProductModal from "@/components/global/data-modals/product-modal";
import ProductDetails from "./components/product-details";
import ProductPricingFactorModal from "./components/product-pricing-factor-modal";
import ProductDimensionsSection from "./components/product-dimensions-section";
import ProductProductionRoutesSection from "./components/product-production-routes-section";

const PAGE_TITLE = { en: "Product Details", ar: "تفاصيل المنتج" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { code } = useParams<{ code: string }>();
  const privateRequest = usePrivateRequest();
  const canUpdateProduct = useHasPermission(PERMISSIONS.UPDATE_PRODUCT);
  const canSetPricingFactor = useHasPermission(PERMISSIONS.SET_PRODUCT_PRICING_FACTOR);
  const canShowActions = canUpdateProduct || canSetPricingFactor;

  const productQuery = useQuery({
    queryKey: queryKeys.products.detail(code),
    queryFn: ({ signal }) => productsApi.get({ privateRequest, code, signal }),
    staleTime: staleTimes.products,
  });

  const dimensionsQuery = useQuery({
    queryKey: queryKeys.products.dimensions(code),
    queryFn: ({ signal }) => productsApi.listDimensions({ privateRequest, code, signal }),
    staleTime: staleTimes.products,
  });

  const productionRoutesQuery = useQuery({
    queryKey: queryKeys.products.productionRoutes(code),
    queryFn: ({ signal }) => productsApi.listProductionRoutes({ privateRequest, code, signal }),
    staleTime: staleTimes.products,
    enabled: !!productQuery.data && isManufactured(productQuery.data.sourceType),
  });

  const product = productQuery.data || null;
  const dimensions = dimensionsQuery.data || [];
  const productionRoutes = productionRoutesQuery.data || [];
  const showProductionRoutes = !!product && isManufactured(product.sourceType);

  const loading = productQuery.isFetching || dimensionsQuery.isFetching || productionRoutesQuery.isFetching;
  const queryError = productQuery.error || dimensionsQuery.error || productionRoutesQuery.error;
  const errorMessage = queryError ? getErrorMessage(locale, queryError) : "";

  useDocumentTitle(`${product?.title || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Products", "المنتجات")}`);

  function handleRetry() {
    productQuery.refetch();
    dimensionsQuery.refetch();
    productionRoutesQuery.refetch();
  }

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [pricingFactorModalOpened, { open: openPricingFactorModal, close: closePricingFactorModal }] = useDisclosure(false);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={loading} onRefetch={handleRetry} />
            {product && canShowActions && (
              <Menu offset={8} withinPortal withArrow>
                <Menu.Target>
                  <Button variant="light" radius="md" rightSection={<ChevronDown size={14} />}>
                    {translate("Actions", "الإجراءات")}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {canUpdateProduct && (
                    <Menu.Item leftSection={<Pencil size={14} />} onClick={openUpdateModal}>
                      {translate("Edit Basic Information", "تعديل المعلومات الأساسية")}
                    </Menu.Item>
                  )}
                  {canSetPricingFactor && (
                    <Menu.Item leftSection={<Tag size={14} />} onClick={openPricingFactorModal}>
                      {translate("Set Pricing Factor", "تعيين معامل التسعير")}
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </div>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading product data", "جاري تحميل ملف المنتج")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading product data", "حدث خطأ أثناء تحميل ملف المنتج")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        product && (
          <>
            <ProductModal
              opened={updateModalOpened}
              close={closeUpdateModal}
              productToUpdate={product}
              setProductToUpdate={() => {}}
            />

            <ProductPricingFactorModal
              opened={pricingFactorModalOpened}
              close={closePricingFactorModal}
              productCode={product.code}
              currentValue={product.pricingFactor ?? null}
            />

            <ProductDetails product={product} />

            <ProductDimensionsSection product={product} dimensions={dimensions} />

            {showProductionRoutes && (
              <ProductProductionRoutesSection productCode={product.code} productionRoutes={productionRoutes} />
            )}
          </>
        )
      )}
    </LayoutBox>
  );
}
