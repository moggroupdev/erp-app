"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { ProductWithDimensions } from "@/types/product";
import { Table, TextInput } from "@mantine/core";
import { Search, X } from "lucide-react";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import PaginationHandler from "@/components/ui/pagination-handler";
import SelectProductSourceType from "@/components/global/selections/enum-based/select-product-source-type";
import SelectProductMain from "@/components/global/selections/reference-based/select-product-main";
import SelectProductSub from "@/components/global/selections/reference-based/select-product-sub";

const PRODUCTS_PER_PAGE = 10;

export default function BrowseProductsModal({
  opened,
  close,
  onSelect,
  initialKeyword = "",
}: {
  opened: boolean;
  close: () => void;
  onSelect: (product: ProductWithDimensions) => void;
  initialKeyword?: string;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { helpers } = useProductCategories();

  const [activePage, setActivePage] = useState(1);
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string | null>(null);
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string | null>(null);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setActivePage(1);
    setImmediateKeyword(initialKeyword.trim());
    setSourceTypeFilter(null);
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    sourceType: sourceTypeFilter,
    mainCategoryId: mainCategoryFilter,
    subCategoryId: subCategoryFilter,
  };

  const params = { limit: PRODUCTS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters = !!(debouncedKeyword || sourceTypeFilter || mainCategoryFilter || subCategoryFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setSourceTypeFilter(null);
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    sourceTypeFilter,
    mainCategoryFilter,
    subCategoryFilter,
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
    enabled: opened,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    if (!opened) return;

    const newFilters = { debouncedKeyword, sourceTypeFilter, mainCategoryFilter, subCategoryFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) setActivePage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, activePage, debouncedKeyword, sourceTypeFilter, mainCategoryFilter, subCategoryFilter]);

  function handleMainCategoryFilterChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(mainCategoryFilter) : value;
    setMainCategoryFilter(next);
    setSubCategoryFilter(null);
  }

  function getCategoryLabels(subCategoryId: string) {
    const sub = helpers.getProductCategorySubById(subCategoryId);
    const main = sub ? helpers.getProductCategoryMainById(sub.mainCategoryId) : null;
    return { main: main?.title || "-", sub: sub?.title || "-" };
  }

  const visibleProducts = paginatedProducts?.data ?? [];

  function handleSelect(product: ProductWithDimensions) {
    onSelect(product);
    close();
  }

  return (
    <Modal opened={opened} onClose={close} title={translate("Browse Products", "تصفح المنتجات")} size="xl">
      <div className="flex flex-col gap-3">
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
          <div className="flex h-80">
            <LoadingSection message={translate("Loading products...", "جاري تحميل المنتجات...")} />
          </div>
        ) : errorMessage ? (
          <div className="flex h-80">
            <ErrorSection
              errorTitle={translate("Error loading products", "خطأ في تحميل المنتجات")}
              errorMessage={errorMessage}
              button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
            />
          </div>
        ) : paginatedProducts && visibleProducts.length === 0 ? (
          <div className="flex h-80">
            {hasActiveFilters ? (
              <NoResultsSection
                keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
                button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
              />
            ) : (
              <EmptySection useDefaultImg message={translate("No products found", "لا يوجد منتجات")} />
            )}
          </div>
        ) : (
          paginatedProducts && (
            <>
              <div className="h-80 overflow-auto">
                <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr className="text-xs">
                      <Table.Th>{translate("Product Name", "اسم المنتج")}</Table.Th>
                      <Table.Th>{translate("Code", "الكود")}</Table.Th>
                      <Table.Th>{translate("Source Type", "نوع المصدر")}</Table.Th>
                      <Table.Th>{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                      <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {visibleProducts.map((product) => {
                      const categories = getCategoryLabels(product.subCategoryId);
                      return (
                        <Table.Tr
                          key={product.code}
                          className="cursor-pointer text-xs text-gray-600 hover:bg-gray-50"
                          onClick={() => handleSelect(product)}
                        >
                          <Table.Td className="font-semibold text-gray-800">{product.title}</Table.Td>
                          <Table.Td>
                            <span className="font-mono">{product.code}</span>
                          </Table.Td>
                          <Table.Td>{getProductSourceTypeLabel(product.sourceType, locale)}</Table.Td>
                          <Table.Td>{categories.main}</Table.Td>
                          <Table.Td>{categories.sub}</Table.Td>
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
          )
        )}
      </div>
    </Modal>
  );
}
