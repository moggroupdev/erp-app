"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox } from "@mantine/core";
import { Factory, FolderTree, Layers, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialsApi, { type MaterialsPrintFilters } from "@/lib/api/materials";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getMaterialTypeLabel, type MaterialType } from "@/lib/constants/enums/material-types";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import PrintAppliedFiltersPanel, { type PrintFilterItem } from "@/components/ui/print-applied-filters-panel";
import MaterialsListPrintDocument from "@/components/documents/materials/materials-list-print-document";

export default function PrintMaterialsModal({
  opened,
  close,
  filters = {},
}: {
  opened: boolean;
  close: () => void;
  filters?: MaterialsPrintFilters;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { data: categoriesData, helpers } = useMaterialCategories();
  const printDate = formatDate(new Date(), locale);

  const [includeQuantity, setIncludeQuantity] = useState(true);
  const [includeUnitPrice, setIncludeUnitPrice] = useState(true);
  const [includeSubcategory, setIncludeSubcategory] = useState(true);
  const [includeEmptyQuantityColumn, setIncludeEmptyQuantityColumn] = useState(false);
  const [ignoreFilters, setIgnoreFilters] = useState(false);

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    materialType: filters.materialType,
    mainCategoryId: filters.mainCategoryId,
    subCategoryId: filters.subCategoryId,
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const printFilters = ignoreFilters ? {} : filters;
  const printQueryParams = {
    limit: "list-all-to-print",
    ...(ignoreFilters ? {} : appliedFilters),
  };

  const filterItems: PrintFilterItem[] = [
    filters.keyword ? { key: "keyword", label: translate("Search", "البحث"), value: filters.keyword, Icon: Search } : null,
    filters.materialType
      ? {
          key: "materialType",
          label: translate("Material Type", "نوع المادة"),
          value: getMaterialTypeLabel(filters.materialType as MaterialType, locale),
          Icon: Factory,
        }
      : null,
    filters.mainCategoryId
      ? {
          key: "mainCategoryId",
          label: translate("Main Category", "الفئة الرئيسية"),
          value: helpers.getMaterialCategoryMainById(filters.mainCategoryId)?.title ?? filters.mainCategoryId,
          Icon: Layers,
        }
      : null,
    filters.subCategoryId
      ? {
          key: "subCategoryId",
          label: translate("Subcategory", "الفئة الفرعية"),
          value: helpers.getMaterialCategorySubById(filters.subCategoryId)?.title ?? filters.subCategoryId,
          Icon: FolderTree,
        }
      : null,
  ].filter((item): item is PrintFilterItem => item !== null);

  const { data: materialsToPrint, refetch: fetchMaterialsToPrint } = useQuery({
    queryKey: queryKeys.materials.list(printQueryParams),
    queryFn: ({ signal }) => materialsApi.listAllToPrint({ privateRequest, signal, filters: printFilters }),
    staleTime: staleTimes.materials,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setIncludeQuantity(true);
      setIncludeUnitPrice(true);
      setIncludeSubcategory(true);
      setIncludeEmptyQuantityColumn(false);
      setIgnoreFilters(false);
    }, 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Materials List", "طباعة قائمة المواد")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters && !ignoreFilters
            ? translate(
                "The printed list will match the filters below. Choose which columns to include.",
                "ستطابق القائمة المطبوعة الفلاتر أدناه. اختر الأعمدة المراد تضمينها.",
              )
            : translate(
                "Choose which columns to include. Materials are grouped by main category.",
                "اختر الأعمدة المراد تضمينها. تُجمّع المواد حسب الفئة الرئيسية.",
              )}
        </p>

        <PrintAppliedFiltersPanel
          filterItems={filterItems}
          ignoreFilters={ignoreFilters}
          onIgnoreFiltersChange={setIgnoreFilters}
          ignoreLabel={translate("Ignore applied filters and print all materials", "تجاهل الفلاتر المطبقة وطباعة كل المواد")}
        />

        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
          <Checkbox
            checked={includeSubcategory}
            onChange={(e) => setIncludeSubcategory(e.currentTarget.checked)}
            label={translate("Include subcategory", "تضمين الفئة الفرعية")}
            radius="md"
          />
          <Checkbox
            checked={includeQuantity}
            onChange={(e) => setIncludeQuantity(e.currentTarget.checked)}
            label={translate("Include quantity", "تضمين الكمية")}
            radius="md"
          />
          <Checkbox
            checked={includeUnitPrice}
            onChange={(e) => setIncludeUnitPrice(e.currentTarget.checked)}
            label={translate("Include unit price", "تضمين سعر الوحدة")}
            radius="md"
          />
          <Checkbox
            checked={includeEmptyQuantityColumn}
            onChange={(e) => setIncludeEmptyQuantityColumn(e.currentTarget.checked)}
            label={translate(
              "Add empty quantity column (for inventory counting)",
              "إضافة عمود كمية فارغ (يستخدم في أعمال الجرد)",
            )}
            radius="md"
          />
        </div>

        <PrintDocument
          title={translate(`Materials List - ${printDate}`, `قائمة المواد - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            await fetchMaterialsToPrint();
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
          {materialsToPrint && categoriesData && (
            <MaterialsListPrintDocument
              materials={materialsToPrint}
              mainCategories={categoriesData.materialCategoryMains}
              getSubCategory={helpers.getMaterialCategorySubById}
              includeQuantity={includeQuantity}
              includeUnitPrice={includeUnitPrice}
              includeSubcategory={includeSubcategory}
              includeEmptyQuantityColumn={includeEmptyQuantityColumn}
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
