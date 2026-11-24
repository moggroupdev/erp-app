"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Factory, FolderTree, Layers, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi, { type ProductsPrintFilters } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getProductSourceTypeLabel, type ProductSourceType } from "@/lib/constants/enums/product-source-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import PrintAppliedFiltersPanel, { type PrintFilterItem } from "@/components/ui/print-applied-filters-panel";
import ProductsListPrintDocument from "@/components/documents/products/products-list-print-document";

export default function PrintProductsModal({
  opened,
  close,
  filters = {},
}: {
  opened: boolean;
  close: () => void;
  filters?: ProductsPrintFilters;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { data: categoriesData, helpers } = useProductCategories();
  const printDate = formatDate(new Date(), locale);

  const [includeSubcategory, setIncludeSubcategory] = useState(true);
  const [ignoreFilters, setIgnoreFilters] = useState(false);

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    mainCategoryId: filters.mainCategoryId,
    subCategoryId: filters.subCategoryId,
    sourceType: filters.sourceType,
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const printFilters = ignoreFilters ? {} : filters;
  const printQueryParams = {
    limit: "list-all-to-print",
    ...(ignoreFilters ? {} : appliedFilters),
  };

  const filterItems: PrintFilterItem[] = [
    filters.keyword ? { key: "keyword", label: translate("Search", "البحث"), value: filters.keyword, Icon: Search } : null,
    filters.mainCategoryId
      ? {
          key: "mainCategoryId",
          label: translate("Main Category", "الفئة الرئيسية"),
          value: helpers.getProductCategoryMainById(filters.mainCategoryId)?.title ?? filters.mainCategoryId,
          Icon: Layers,
        }
      : null,
    filters.subCategoryId
      ? {
          key: "subCategoryId",
          label: translate("Subcategory", "الفئة الفرعية"),
          value: helpers.getProductCategorySubById(filters.subCategoryId)?.title ?? filters.subCategoryId,
          Icon: FolderTree,
        }
      : null,
    filters.sourceType
      ? {
          key: "sourceType",
          label: translate("Source Type", "نوع المصدر"),
          value: getProductSourceTypeLabel(filters.sourceType as ProductSourceType, locale),
          Icon: Factory,
        }
      : null,
  ].filter((item): item is PrintFilterItem => item !== null);

  const { data: productsToPrint, refetch: fetchProductsToPrint } = useQuery({
    queryKey: queryKeys.products.list(printQueryParams),
    queryFn: ({ signal }) => productsApi.listAllToPrint({ privateRequest, signal, filters: printFilters }),
    staleTime: staleTimes.products,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setIncludeSubcategory(true);
      setIgnoreFilters(false);
    }, 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Products List", "طباعة قائمة المنتجات")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters && !ignoreFilters
            ? translate(
                "The printed list will match the filters below. Optionally show subcategory on each row.",
                "ستطابق القائمة المطبوعة الفلاتر أدناه. يمكنك اختيار عرض الفئة الفرعية في كل صف.",
              )
            : translate(
                "Choose whether to show the subcategory. Products are then sorted by subcategory, then by name, inside each main category.",
                "اختر عرض الفئة الفرعية. تُرتب المنتجات بعدها حسب الفئة الفرعية ثم الاسم داخل كل فئة رئيسية.",
              )}
        </p>

        <PrintAppliedFiltersPanel
          filterItems={filterItems}
          ignoreFilters={ignoreFilters}
          onIgnoreFiltersChange={setIgnoreFilters}
          ignoreLabel={translate("Ignore applied filters and print all products", "تجاهل الفلاتر المطبقة وطباعة كل المنتجات")}
        />

        <div className="rounded-xl border border-gray-200 px-3 py-2.5">
          <Checkbox
            checked={includeSubcategory}
            onChange={(e) => setIncludeSubcategory(e.currentTarget.checked)}
            label={translate("Display subcategory", "عرض الفئة الفرعية")}
            radius="md"
          />
        </div>

        <PrintDocument
          title={translate(`Products List - ${printDate}`, `قائمة المنتجات - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            await fetchProductsToPrint();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button
              onClick={onClick}
              leftSection={icon}
              color="dark"
              variant="light"
              radius="md"
              fullWidth
              disabled={loading}
            >
              {label}
            </Button>
          )}
        >
          {productsToPrint && categoriesData && (
            <ProductsListPrintDocument
              products={productsToPrint}
              mainCategories={categoriesData.productCategoryMains}
              getSubCategory={helpers.getProductCategorySubById}
              includeSubcategory={includeSubcategory}
              appliedFilters={
                ignoreFilters ? [] : filterItems.map(({ label, value }) => ({ label, value }))
              }
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
