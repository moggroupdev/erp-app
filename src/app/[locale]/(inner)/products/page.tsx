"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDate } from "@/lib/helpers/date-formaters";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import { formatDimensionLabel } from "@/lib/helpers/format-dimension-label";
import { type Product, type ProductWithDimensions } from "@/types/product";
import { Button, Table, TextInput } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import { Pencil, Plus, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import ProductsListPrintDocument from "@/components/documents/products-list-print-document";
import ProductModal from "@/components/global/data-modals/product-modal";
import SelectProductSourceType from "@/components/global/selections/enum-based/select-product-source-type";
import SelectProductMain from "@/components/global/selections/reference-based/select-product-main";
import SelectProductSub from "@/components/global/selections/reference-based/select-product-sub";

const PAGE_TITLE = { en: "Products Catalog", ar: "كتالوج المنتجات" };

const PRODUCTS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const printDate = formatDate(new Date(), locale);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const { data: categoriesData, helpers } = useProductCategories();

  function getCategoryLabels(subCategoryId: string) {
    const sub = helpers.getProductCategorySubById(subCategoryId);
    const main = sub ? helpers.getProductCategoryMainById(sub.mainCategoryId) : null;
    return { main: main?.title || "-", sub: sub?.title || "-" };
  }

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string | null>(urlSearchParams.get("mainCategoryId") || null);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | null>(urlSearchParams.get("subCategoryId") || null);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string | null>(urlSearchParams.get("sourceType") || null);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    mainCategoryId: mainCategoryFilter,
    subCategoryId: subCategoryFilter,
    sourceType: sourceTypeFilter,
  };

  const params = { limit: PRODUCTS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters: boolean = !!(
    activePage !== 1 ||
    debouncedKeyword ||
    mainCategoryFilter ||
    subCategoryFilter ||
    sourceTypeFilter
  );

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
    setSourceTypeFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    mainCategoryFilter,
    subCategoryFilter,
    sourceTypeFilter,
  });

  const {
    data: paginatedProducts,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.products,
    placeholderData: keepPreviousData,
  });

  // Only used for printing
  const { data: allProducts, refetch: fetchAllProducts } = useQuery({
    queryKey: queryKeys.products.list({ limit: "list-all-to-print" }),
    queryFn: ({ signal }) => productsApi.listAllToPrint({ privateRequest, signal }),
    staleTime: staleTimes.products,
    enabled: false, // Disabled by default, will be enabled when the print button is clicked
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, mainCategoryFilter, subCategoryFilter, sourceTypeFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, mainCategoryFilter, subCategoryFilter, sourceTypeFilter]);

  function handleMainCategoryFilterChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(mainCategoryFilter) : value;
    setMainCategoryFilter(next);
    setSubCategoryFilter(null);
  }

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [productToUpdate, setProductToUpdate] = useState<Product | null>(null);

  function handleOpenUpdateModal(product: Product) {
    setProductToUpdate(product);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-2">
            <PermissionGuard permission={PERMISSIONS.PRINT_PRODUCTS_LIST}>
              <div className="flex-center px-1">
                <PrintDocument
                  buttonType="icon"
                  title={translate(`Products List - ${printDate}`, `قائمة المنتجات - ${printDate}`)}
                  onBeforePrint={async () => {
                    if (!allProducts) await fetchAllProducts();
                  }}
                >
                  {allProducts && categoriesData && (
                    <ProductsListPrintDocument
                      products={allProducts}
                      mainCategories={categoriesData.productCategoryMains}
                      getSubCategory={helpers.getProductCategorySubById}
                    />
                  )}
                </PrintDocument>
              </div>
            </PermissionGuard>
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add New Product", "إضافة منتج جديد")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <div className="col-span-1 md:col-span-3">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search for a product...", "ابحث عن منتج...")}
            leftSection={<Search size={15} />}
            radius="md"
            rightSection={
              keyword ? (
                <button type="button" onClick={() => setImmediateKeyword("")}>
                  <X size={15} />
                </button>
              ) : undefined
            }
          />
        </div>

        <SelectProductSourceType
          value={sourceTypeFilter}
          setValue={setSourceTypeFilter}
          placeholder={translate("Select source type...", "اختر نوع المصدر...")}
          clearable
          radius="md"
        />

        <SelectProductMain
          value={mainCategoryFilter}
          setValue={handleMainCategoryFilterChange}
          placeholder={translate("Select main category...", "اختر الفئة الرئيسية...")}
          clearable
          searchable
          radius="md"
        />

        <SelectProductSub
          value={subCategoryFilter}
          setValue={setSubCategoryFilter}
          mainCategoryScope={mainCategoryFilter ?? undefined}
          placeholder={translate("Select subcategory...", "اختر الفئة الفرعية...")}
          clearable
          searchable
          radius="md"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading products...", "جاري تحميل المنتجات...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading products", "خطأ في تحميل المنتجات")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedProducts &&
        (paginatedProducts.data.length === 0 ? (
          debouncedKeyword || mainCategoryFilter || subCategoryFilter || sourceTypeFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No products found", "لا يوجد منتجات")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Product Name", "اسم المنتج")}</Table.Th>
                    <Table.Th>
                      {translate("Standard Dimension", "الأبعاد النمطية")} ({translation.productDimensionUnit})
                    </Table.Th>
                    <Table.Th>{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                    <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    <Table.Th>{translate("Source Type", "نوع المصدر")}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedProducts.data.map((product) => {
                    const categories = getCategoryLabels(product.subCategoryId);
                    const defaultDimension = product.dimensions.find((dimension) => dimension.isDefault) ?? null;
                    return (
                      <Table.Tr key={product.code} className="text-gray-600">
                        <Table.Td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">{product.code}</span>
                            <CopyButton text={product.code} />
                          </div>
                        </Table.Td>
                        <Table.Td className="font-semibold text-gray-800">
                          <Link href={getLocalizedHref(`/products/${product.code}`)} className="hover:underline">
                            {product.title}
                          </Link>
                        </Table.Td>
                        <Table.Td className="text-sm">
                          {defaultDimension ? formatDimensionLabel(defaultDimension) : ""}
                        </Table.Td>
                        <Table.Td>{categories.main}</Table.Td>
                        <Table.Td>{categories.sub}</Table.Td>
                        <Table.Td>{getProductSourceTypeLabel(product.sourceType, locale)}</Table.Td>
                        <Table.Td w={0}>
                          <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT}>
                            <button
                              onClick={() => handleOpenUpdateModal(product)}
                              className="rounded-lg bg-gray-100 p-1.5 transition-colors hover:bg-gray-200"
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGuard>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<ProductWithDimensions>
              paginatedData={paginatedProducts}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      <ProductModal
        opened={modalOpened}
        close={closeModal}
        productToUpdate={productToUpdate}
        setProductToUpdate={setProductToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!productToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
