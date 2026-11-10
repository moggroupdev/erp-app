"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Factory, FolderTree, Layers, ListFilter, Search, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi, { type ProductsPrintFilters } from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import {
  getProductSourceTypeLabel,
  type ProductSourceType,
} from "@/lib/constants/enums/product-source-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import ProductsListPrintDocument from "@/components/documents/products/products-list-print-document";

type FilterItem = {
  key: string;
  label: string;
  value: string;
  Icon: LucideIcon;
};

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

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    mainCategoryId: filters.mainCategoryId,
    subCategoryId: filters.subCategoryId,
    sourceType: filters.sourceType,
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const printQueryParams = { limit: "list-all-to-print", ...appliedFilters };

  const filterItems: FilterItem[] = [
    filters.keyword
      ? { key: "keyword", label: translate("Search", "البحث"), value: filters.keyword, Icon: Search }
      : null,
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
  ].filter((item): item is FilterItem => item !== null);

  const { data: productsToPrint, refetch: fetchProductsToPrint } = useQuery({
    queryKey: queryKeys.products.list(printQueryParams),
    queryFn: ({ signal }) => productsApi.listAllToPrint({ privateRequest, signal, filters }),
    staleTime: staleTimes.products,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => setIncludeSubcategory(true), 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Products List", "طباعة قائمة المنتجات")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters
            ? translate(
                "The printed list will match the filters below. Optionally show subcategory on each row.",
                "ستطابق القائمة المطبوعة الفلاتر أدناه. يمكنك اختيار عرض الفئة الفرعية في كل صف.",
              )
            : translate(
                "Choose whether to show the subcategory. Products are then sorted by subcategory, then by name, inside each main category.",
                "اختر عرض الفئة الفرعية. تُرتب المنتجات بعدها حسب الفئة الفرعية ثم الاسم داخل كل فئة رئيسية.",
              )}
        </p>

        {hasFilters && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
              <div className="flex min-w-0 items-center gap-2 text-haze-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-haze-100 bg-haze-50">
                  <ListFilter size={14} />
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {translate("Applied filters", "الفلاتر المطبقة")}
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-haze-50 px-2 py-0.5 text-xs font-medium text-haze-700">
                {translate(`${filterItems.length} active`, `${filterItems.length} نشط`)}
              </span>
            </div>

            <dl className="divide-y divide-gray-200">
              {filterItems.map(({ key, label, value, Icon }) => (
                <div key={key} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-2 px-3 py-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Icon size={13} className="shrink-0 text-haze-600" aria-hidden />
                    <span className="truncate">{label}</span>
                  </dt>
                  <dd className="min-w-0 text-sm font-semibold break-words text-gray-900" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

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
            <Button onClick={onClick} leftSection={icon} color="dark" variant="light" radius="md" fullWidth disabled={loading}>
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
              appliedFilters={filterItems.map(({ label, value }) => ({ label, value }))}
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
