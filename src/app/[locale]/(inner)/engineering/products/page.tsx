"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import { type Product } from "@/types/product";
import { Button, Table, TextInput } from "@mantine/core";
import { Filter, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import RefetchButton from "@/components/ui/refetch-button";

const PAGE_TITLE = { en: "Products", ar: "المنتجات" };

const PRODUCTS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(urlSearchParams.get("categoryId") || null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(urlSearchParams.get("subcategoryId") || null);

  const [filtersSectionOpened, setFiltersSectionOpened] = useState(categoryFilter || subcategoryFilter || false);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    categoryId: categoryFilter,
    subcategoryId: subcategoryFilter,
  };

  const params = { limit: PRODUCTS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setCategoryFilter(null);
    setSubcategoryFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    categoryFilter,
    subcategoryFilter,
  });

  const {
    data: paginatedProducts,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list({ privateRequest, params, signal }),
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, categoryFilter, subcategoryFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, categoryFilter, subcategoryFilter]);

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/dashboard"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      <div className="flex gap-2">
        <div className="grow">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search for a product...", "ابحث عن منتج...")}
            leftSection={<Search />}
            rightSection={
              keyword && (
                <button onClick={() => setImmediateKeyword("")}>
                  <X />
                </button>
              )
            }
            radius="md"
          />
        </div>

        <Button
          variant="light"
          radius="md"
          onClick={() => {
            if (filtersSectionOpened) {
              setFiltersSectionOpened(false);
              resetAllFilters();
            } else setFiltersSectionOpened(true);
          }}
          title={
            filtersSectionOpened
              ? translate("Close and clear all filters", "غلق ومسح جميع الفلاتر")
              : translate("Open filters", "فتح الفلاتر")
          }
        >
          {filtersSectionOpened ? <X /> : <Filter />}
        </Button>
      </div>

      {filtersSectionOpened && <div className="flex gap-2 border-b border-gray-200 pb-4">Nothing to filter by yet.</div>}

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
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: () => setImmediateKeyword("") }}
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
                    <Table.Th>{translate("Title", "العنوان")}</Table.Th>
                    <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    <Table.Th>{translate("Source Type", "نوع المصدر")}</Table.Th>
                    <Table.Th>{translate("Estimated Production Time", "وقت الإنتاج المقدر")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedProducts.data.map((product) => (
                    <Table.Tr key={product.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">{product.code}</Table.Td>
                      <Table.Td className="font-semibold text-gray-800">{product.title}</Table.Td>
                      <Table.Td>{product.subCategoryId}</Table.Td>
                      <Table.Td>{getProductSourceTypeLabel(product.sourceType, locale)}</Table.Td>
                      <Table.Td>{product.estimatedProductionTime}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<Product>
              paginatedData={paginatedProducts}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
