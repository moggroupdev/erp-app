"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Download, Factory, FolderTree, Layers, ListFilter, Search, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useProductCategories from "@/hooks/reference/use-product-categories";
import productsApi, { type ProductExcelColumnOptions, type ProductsPrintFilters } from "@/lib/api/products";
import { getProductSourceTypeLabel, type ProductSourceType } from "@/lib/constants/enums/product-source-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import getErrorMessage from "@/lib/helpers/get-error-message";
import Modal from "@/components/ui/modal";

const COLUMN_OPTIONS = [
  { key: "reviewEstimate", en: "Review estimate in Excel", ar: "مراجعة المقايسة في الأكسيل" },
  { key: "addedToDatabase", en: "Added to the database", ar: "الإضافة في قاعدة البيانات" },
  { key: "design", en: "Design", ar: "التصميم" },
  { key: "completionDate", en: "Completion date", ar: "تاريخ الانتهاء" },
  { key: "notes", en: "Notes", ar: "ملاحظات" },
] as const satisfies readonly { key: keyof ProductExcelColumnOptions; en: string; ar: string }[];

const EMPTY_COLUMNS: ProductExcelColumnOptions = {};

type FilterItem = {
  key: string;
  label: string;
  value: string;
  Icon: LucideIcon;
};

export default function DownloadProductsExcelModal({
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
  const { helpers } = useProductCategories();
  const [columns, setColumns] = useState<ProductExcelColumnOptions>(EMPTY_COLUMNS);
  const [ignoreFilters, setIgnoreFilters] = useState(false);

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    mainCategoryId: filters.mainCategoryId,
    subCategoryId: filters.subCategoryId,
    sourceType: filters.sourceType,
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const downloadFilters = ignoreFilters ? {} : filters;

  const filterItems: FilterItem[] = [
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
  ].filter((item): item is FilterItem => item !== null);

  const downloadMutation = useMutation({
    mutationFn: () => productsApi.downloadExcel({ privateRequest, columns, filters: downloadFilters }),
    onSuccess: () => {
      close();
      setTimeout(() => {
        setColumns(EMPTY_COLUMNS);
        setIgnoreFilters(false);
      }, 250);
    },
    onError: (error) => toast.error(getErrorMessage(locale, error)),
  });

  function handleClose() {
    if (downloadMutation.isPending) return;
    close();
    setTimeout(() => {
      setColumns(EMPTY_COLUMNS);
      setIgnoreFilters(false);
    }, 250);
  }

  function toggleColumn(key: keyof ProductExcelColumnOptions, checked: boolean) {
    setColumns((current) => ({ ...current, [key]: checked }));
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Download Excel File", "تنزيل ملف إكسل")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters && !ignoreFilters
            ? translate(
                "The Excel file will match the filters below. Choose extra columns to add; they are left empty so you can fill them in the sheet.",
                "سيطابق ملف الإكسل الفلاتر أدناه. اختر الأعمدة الإضافية؛ تُترك فارغة لتعبئتها في الملف.",
              )
            : translate(
                "Choose extra columns to add. They are left empty so you can fill them in the sheet.",
                "اختر الأعمدة الإضافية. تُترك فارغة لتعبئتها في الملف.",
              )}
        </p>

        {hasFilters && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
              <div className="text-haze-700 flex min-w-0 items-center gap-2">
                <span className="border-haze-100 bg-haze-50 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                  <ListFilter size={14} />
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {translate("Applied filters", "الفلاتر المطبقة")}
                </span>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                  ignoreFilters ? "bg-gray-100 text-gray-500 line-through" : "bg-haze-50 text-haze-700"
                }`}
              >
                {translate(`${filterItems.length} active`, `${filterItems.length} نشط`)}
              </span>
            </div>

            <dl className={`divide-y divide-gray-200 ${ignoreFilters ? "opacity-50" : ""}`}>
              {filterItems.map(({ key, label, value, Icon }) => (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-2 px-3 py-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]"
                >
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Icon size={13} className="text-haze-600 shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </dt>
                  <dd
                    className={`min-w-0 text-sm font-semibold wrap-break-word text-gray-900 ${ignoreFilters ? "line-through" : ""}`}
                    title={value}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-gray-200 bg-white px-3 py-2.5">
              <Checkbox
                checked={ignoreFilters}
                onChange={(e) => setIgnoreFilters(e.currentTarget.checked)}
                label={translate(
                  "Ignore applied filters and download all products",
                  "تجاهل الفلاتر المطبقة وتنزيل كل المنتجات",
                )}
                radius="md"
              />
            </div>
          </section>
        )}

        {COLUMN_OPTIONS.map((option) => (
          <Checkbox
            key={option.key}
            checked={!!columns[option.key]}
            onChange={(event) => toggleColumn(option.key, event.currentTarget.checked)}
            label={translate(option.en, option.ar)}
            radius="md"
          />
        ))}

        <Button
          onClick={() => downloadMutation.mutate()}
          loading={downloadMutation.isPending}
          leftSection={<Download size={16} />}
          radius="md"
          fullWidth
        >
          {translate("Download", "تنزيل")}
        </Button>
      </div>
    </Modal>
  );
}
