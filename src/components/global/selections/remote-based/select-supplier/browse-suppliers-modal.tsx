"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import suppliersApi from "@/lib/api/suppliers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { getSupplierClassificationLabel } from "@/lib/constants/enums/supplier-classifications";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Supplier } from "@/types/supplier";
import { Table, TextInput } from "@mantine/core";
import { Search, X } from "lucide-react";
import Modal from "@/components/ui/modal";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import PaginationHandler from "@/components/ui/pagination-handler";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";
import SelectSupplierClassification from "@/components/global/selections/enum-based/select-supplier-classification";

const SUPPLIERS_PER_PAGE = 10;

type SelectableSupplier = Pick<Supplier, "id" | "name" | "code">;

export default function BrowseSuppliersModal({
  opened,
  close,
  onSelect,
  excludeIds = [],
  initialKeyword = "",
}: {
  opened: boolean;
  close: () => void;
  onSelect: (supplier: SelectableSupplier) => void;
  excludeIds?: string[];
  initialKeyword?: string;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  const [activePage, setActivePage] = useState(1);
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState("");
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setActivePage(1);
    setImmediateKeyword(initialKeyword.trim());
    setMainCategoryFilter(null);
    setClassificationFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    mainCategoryId: mainCategoryFilter,
    classification: classificationFilter,
  };

  const params = { limit: SUPPLIERS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters = !!(debouncedKeyword || mainCategoryFilter || classificationFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setMainCategoryFilter(null);
    setClassificationFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    mainCategoryFilter,
    classificationFilter,
  });

  const {
    data: paginatedSuppliers,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.suppliers.list(params),
    queryFn: ({ signal }) => suppliersApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.suppliers,
    placeholderData: keepPreviousData,
    enabled: opened,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    if (!opened) return;

    const newFilters = { debouncedKeyword, mainCategoryFilter, classificationFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) setActivePage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, activePage, debouncedKeyword, mainCategoryFilter, classificationFilter]);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const visibleSuppliers = useMemo(() => {
    const suppliers = paginatedSuppliers?.data ?? [];
    return suppliers.filter((supplier) => !excludeSet.has(supplier.id));
  }, [paginatedSuppliers?.data, excludeSet]);

  function handleSelect(supplier: Supplier) {
    onSelect(supplier);
    close();
  }

  return (
    <Modal opened={opened} onClose={close} title={translate("Browse Suppliers", "تصفح الموردين")} size="xl">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <div className="col-span-1 md:col-span-2">
            <TextInput
              value={keyword}
              onChange={(e) => setPendingKeyword(e.currentTarget.value)}
              placeholder={translate("Search for a supplier...", "ابحث عن مورد...")}
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
            setValue={setMainCategoryFilter}
            placeholder={translate("Select material category...", "اختر فئة المادة...")}
            clearable
            searchable
            radius="md"
          />

          <SelectSupplierClassification
            value={classificationFilter}
            setValue={setClassificationFilter}
            placeholder={translate("Select classification...", "اختر التصنيف...")}
            clearable
            searchable
            radius="md"
          />
        </div>

        {isFetching ? (
          <div className="flex h-80">
            <LoadingSection message={translate("Loading suppliers...", "جاري تحميل الموردين...")} />
          </div>
        ) : errorMessage ? (
          <div className="flex h-80">
            <ErrorSection
              errorTitle={translate("Error loading suppliers", "خطأ في تحميل الموردين")}
              errorMessage={errorMessage}
              button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
            />
          </div>
        ) : paginatedSuppliers && visibleSuppliers.length === 0 ? (
          <div className="flex h-80">
            {hasActiveFilters || excludeSet.size > 0 ? (
              <NoResultsSection
                keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
                button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
              />
            ) : (
              <EmptySection useDefaultImg message={translate("No suppliers found", "لا يوجد موردون")} />
            )}
          </div>
        ) : (
          paginatedSuppliers && (
            <>
              <div className="h-80 overflow-auto">
                <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr className="text-xs">
                      <Table.Th>{translate("Supplier", "المورد")}</Table.Th>
                      <Table.Th>{translate("Code", "الكود")}</Table.Th>
                      <Table.Th>{translate("Classification", "التصنيف")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {visibleSuppliers.map((supplier) => (
                      <Table.Tr
                        key={supplier.id}
                        className="cursor-pointer text-xs text-gray-600 hover:bg-gray-50"
                        onClick={() => handleSelect(supplier)}
                      >
                        <Table.Td className="font-semibold text-gray-800">{supplier.name}</Table.Td>
                        <Table.Td>
                          <span className="font-mono">{supplier.code}</span>
                        </Table.Td>
                        <Table.Td>
                          {supplier.classification ? getSupplierClassificationLabel(supplier.classification, locale) : "-"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>

              <PaginationHandler<Supplier>
                paginatedData={paginatedSuppliers}
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
