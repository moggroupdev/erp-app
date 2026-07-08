"use client";

import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import useDataHandler from "@/hooks/use-data-handler";
import productsApi from "@/lib/api/products";
import handleRequest from "@/lib/helpers/handle-request";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type PaginatedData } from "@/types/global";
import { type Product } from "@/types/product";
import { Button, Table, TextInput } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import { ArrowUp, BadgePercent, Barcode, Filter, Plus, Search, X } from "lucide-react";
import AdminLayoutBox from "@/components/ui/admin-layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";

const PAGE_TITLE = { en: "Products", ar: "المنتجات" };

const PRODUCTS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate, translation } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();

  // State management for filters
  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [seasonFilter, setSeasonFilter] = useState<string | null>(urlSearchParams.get("season") || null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(urlSearchParams.get("categoryId") || null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(urlSearchParams.get("subcategoryId") || null);

  const [filtersSectionOpened, setFiltersSectionOpened] = useState(
    seasonFilter || categoryFilter || subcategoryFilter || false,
  );

  const params = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    season: seasonFilter,
    categoryId: categoryFilter,
    subcategoryId: subcategoryFilter,
  };

  // const hasActiveFilters: boolean = !!(
  //   activePage !== 1 ||
  //   debouncedKeyword ||
  //   seasonFilter ||
  //   categoryFilter ||
  //   subcategoryFilter
  // );

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setSeasonFilter(null);
    setCategoryFilter(null);
    setSubcategoryFilter(null);
  };

  // Track the previous filters and check if they have changed to reset the active page to 1.
  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    seasonFilter,
    categoryFilter,
    subcategoryFilter,
  });

  const {
    privateRequest,
    loading,
    setLoading,
    error,
    setError,
    data: paginatedProducts,
    setData: setPaginatedProducts,
  } = useDataHandler<PaginatedData<Product> | null>({ initialData: null, initialLoading: true });

  // Handle previous requests abortion
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancellationRef = useRef({ canceled: false });
  const abortPreviousRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      cancellationRef.current.canceled = true;
    }
  };

  function handleLoadProducts() {
    // Cancel any existing request before starting a new one
    abortPreviousRequest();

    // Create new controller and canceled flag for this request
    abortControllerRef.current = new AbortController();
    cancellationRef.current = { canceled: false };

    handleRequest(
      locale,
      setLoading,
      setError,
      async () => {
        const response = await productsApi.list({
          privateRequest,
          params: { limit: PRODUCTS_PER_PAGE, ...removeEmptyParams(params) },
          signal: abortControllerRef.current!.signal,
        });
        if (!cancellationRef.current.canceled) setPaginatedProducts(response);
      },
      cancellationRef.current,
    );
  }

  useEffect(() => {
    // Sync URL search params with filters
    router.replace(`?` + new URLSearchParams(removeEmptyParams(params)), { scroll: false });

    // If the filters have changed, reset the active page to 1.
    const newFilters = { debouncedKeyword, seasonFilter, categoryFilter, subcategoryFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    handleLoadProducts();

    // Abort request when component unmounts or dependencies change
    return () => abortPreviousRequest();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, seasonFilter, categoryFilter, subcategoryFilter]);

  // ========== Handle Modals ==========

  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);
  const [discountModalOpened, { open: openDiscountModal, close: closeDiscountModal }] = useDisclosure(false);

  return (
    <AdminLayoutBox
      header={{
        backLink: getLocalizedHref("/dashboard/home"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-2">
            <Link href={getLocalizedHref(`/dashboard/home/products/variants`)}>
              <Button variant="light" color="grape" leftSection={<Barcode />} radius="md">
                {translate("Variants", "الأصناف")}
              </Button>
            </Link>
            <PermissionGuard permission={PERMISSIONS.UPDATE_PRODUCT}>
              <Button
                onClick={openDiscountModal}
                variant="light"
                color="pink"
                radius="md"
                leftSection={<BadgePercent />}
              >
                {translate("Global Discounts", "خصم عام")}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.ADD_PRODUCT}>
              <>
                <Button
                  onClick={openImportModal}
                  variant="light"
                  color="teal"
                  radius="md"
                  leftSection={<ArrowUp />}
                >
                  {translate("Import", "استيراد")}
                </Button>
                <Link href={getLocalizedHref(`/dashboard/home/products/add`)}>
                  <Button variant="light" color="teal" leftSection={<Plus />} radius="md">
                    {translate("Add New Product", "إضافة منتج جديد")}
                  </Button>
                </Link>
              </>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      {/* Filters */}
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
          />
        </div>

        <Button
          variant="light"
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

      {/* Content */}
      {loading ? (
        <LoadingSection message={translate("Loading products...", "جاري تحميل المنتجات...")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading products", "خطأ في تحميل المنتجات")}
          errorMessage={error}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: handleLoadProducts }}
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
            {/* Table */}
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

            {/* Pagination */}
            <PaginationHandler<Product>
              paginatedData={paginatedProducts}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </AdminLayoutBox>
  );
}
