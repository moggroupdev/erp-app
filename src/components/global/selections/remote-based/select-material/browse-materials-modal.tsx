"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Material } from "@/types/material";
import { Table, TextInput } from "@mantine/core";
import { Search, X } from "lucide-react";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import PaginationHandler from "@/components/ui/pagination-handler";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";
import SelectMaterialSub from "@/components/global/selections/reference-based/select-material-sub";

const MATERIALS_PER_PAGE = 10;

export default function BrowseMaterialsModal({
  opened,
  close,
  onSelect,
  excludeCodes = [],
}: {
  opened: boolean;
  close: () => void;
  onSelect: (material: Material) => void;
  excludeCodes?: string[];
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { helpers } = useMaterialCategories();

  const [activePage, setActivePage] = useState(1);
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState("");
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string | null>(null);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setActivePage(1);
    setImmediateKeyword("");
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    mainCategoryId: mainCategoryFilter,
    subCategoryId: subCategoryFilter,
  };

  const params = { limit: MATERIALS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters = !!(debouncedKeyword || mainCategoryFilter || subCategoryFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    mainCategoryFilter,
    subCategoryFilter,
  });

  const {
    data: paginatedMaterials,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materials.list(params),
    queryFn: ({ signal }) => materialsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.materials,
    placeholderData: keepPreviousData,
    enabled: opened,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    if (!opened) return;

    const newFilters = { debouncedKeyword, mainCategoryFilter, subCategoryFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) setActivePage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, activePage, debouncedKeyword, mainCategoryFilter, subCategoryFilter]);

  function handleMainCategoryFilterChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(mainCategoryFilter) : value;
    setMainCategoryFilter(next);
    setSubCategoryFilter(null);
  }

  function getCategoryLabels(subCategoryId: string) {
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return { main: main?.title || "-", sub: sub?.title || "-" };
  }

  const excludeSet = useMemo(() => new Set(excludeCodes), [excludeCodes]);

  const visibleMaterials = useMemo(() => {
    const materials = paginatedMaterials?.data ?? [];
    return materials.filter((material) => !excludeSet.has(material.code));
  }, [paginatedMaterials?.data, excludeSet]);

  function handleSelect(material: Material) {
    onSelect(material);
    close();
  }

  return (
    <Modal opened={opened} onClose={close} title={translate("Browse Materials", "تصفح المواد")} size="xl">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <TextInput
              value={keyword}
              onChange={(e) => setPendingKeyword(e.currentTarget.value)}
              placeholder={translate("Search for a material...", "ابحث عن مادة...")}
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

          <SelectMaterialMain
            value={mainCategoryFilter}
            setValue={handleMainCategoryFilterChange}
            placeholder={translate("Select main category", "اختر الفئة الرئيسية")}
            clearable
            searchable
            radius="md"
          />

          <SelectMaterialSub
            value={subCategoryFilter}
            setValue={setSubCategoryFilter}
            mainCategoryScope={mainCategoryFilter ?? undefined}
            placeholder={translate("Select subcategory", "اختر الفئة الفرعية")}
            clearable
            searchable
            radius="md"
          />
        </div>

        {isFetching ? (
          <div className="flex h-80">
            <LoadingSection message={translate("Loading materials...", "جاري تحميل المواد...")} />
          </div>
        ) : errorMessage ? (
          <div className="flex h-80">
            <ErrorSection
              errorTitle={translate("Error loading materials", "خطأ في تحميل المواد")}
              errorMessage={errorMessage}
              button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
            />
          </div>
        ) : paginatedMaterials && visibleMaterials.length === 0 ? (
          <div className="flex h-80">
            {hasActiveFilters || excludeSet.size > 0 ? (
              <NoResultsSection
                keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
                button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
              />
            ) : (
              <EmptySection useDefaultImg message={translate("No materials found", "لا توجد مواد")} />
            )}
          </div>
        ) : (
          paginatedMaterials && (
            <>
              <div className="h-80 overflow-auto">
                <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr className="text-xs">
                      <Table.Th>{translate("Item Name", "اسم العنصر")}</Table.Th>
                      <Table.Th>{translate("Code", "الكود")}</Table.Th>
                      <Table.Th>{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                      <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {visibleMaterials.map((material) => {
                      const categories = getCategoryLabels(material.subCategoryId);
                      return (
                        <Table.Tr
                          key={material.code}
                          className="cursor-pointer text-xs text-gray-600 hover:bg-gray-50"
                          onClick={() => handleSelect(material)}
                        >
                          <Table.Td className="font-semibold text-gray-800">{material.title}</Table.Td>
                          <Table.Td>
                            <span className="font-mono">{material.code}</span>
                          </Table.Td>
                          <Table.Td>{categories.main}</Table.Td>
                          <Table.Td>{categories.sub}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </div>

              <PaginationHandler<Material>
                paginatedData={paginatedMaterials}
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
