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
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { type Material, type MaterialWithUnitConversions } from "@/types/material";
import { Button, Table, TextInput } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import { Pencil, Plus, Printer, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import UnitToggle from "@/components/ui/unit-toggle";
import MaterialModal from "@/components/global/data-modals/material-modal";
import SelectMaterialType from "@/components/global/selections/enum-based/select-material-type";
import SelectMaterialMain from "@/components/global/selections/reference-based/select-material-main";
import SelectMaterialSub from "@/components/global/selections/reference-based/select-material-sub";
import PrintMaterialsModal from "./components/print-materials-modal";

const PAGE_TITLE = { en: "Materials List", ar: "قائمة المواد" };

const MATERIALS_PER_PAGE = 25;

export default function Page() {
  const { locale, translation, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const { helpers } = useMaterialCategories();

  function getCategoryLabels(subCategoryId: string) {
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return { main: main?.title || "-", sub: sub?.title || "-" };
  }

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string | null>(urlSearchParams.get("materialType") || null);
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string | null>(urlSearchParams.get("mainCategoryId") || null);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string | null>(urlSearchParams.get("subCategoryId") || null);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    materialType: materialTypeFilter,
    mainCategoryId: mainCategoryFilter,
    subCategoryId: subCategoryFilter,
  };

  const params = { limit: MATERIALS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters: boolean = !!(
    activePage !== 1 ||
    debouncedKeyword ||
    materialTypeFilter ||
    mainCategoryFilter ||
    subCategoryFilter
  );

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setMaterialTypeFilter(null);
    setMainCategoryFilter(null);
    setSubCategoryFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    materialTypeFilter,
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
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, materialTypeFilter, mainCategoryFilter, subCategoryFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, materialTypeFilter, mainCategoryFilter, subCategoryFilter]);

  function handleMainCategoryFilterChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(mainCategoryFilter) : value;
    setMainCategoryFilter(next);
    setSubCategoryFilter(null);
  }

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [materialToUpdate, setMaterialToUpdate] = useState<Material | null>(null);
  const [printModalOpened, { open: openPrintModal, close: closePrintModal }] = useDisclosure(false);

  function handleOpenUpdateModal(material: Material) {
    setMaterialToUpdate(material);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/warehouse"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-2">
            <PermissionGuard permission={PERMISSIONS.PRINT_MATERIALS_LIST}>
              <button
                type="button"
                title={translate("Print Materials List", "طباعة قائمة المواد")}
                onClick={openPrintModal}
                className="rounded-md px-1 text-xs text-gray-800 hover:text-gray-800/75"
              >
                <Printer size={15} />
              </button>
            </PermissionGuard>
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_MATERIAL}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add New Material", "إضافة مادة جديدة")}
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

        <SelectMaterialType
          value={materialTypeFilter}
          setValue={setMaterialTypeFilter}
          placeholder={translate("Select type...", "اختر النوع...")}
          clearable
          radius="md"
        />

        <SelectMaterialMain
          value={mainCategoryFilter}
          setValue={handleMainCategoryFilterChange}
          placeholder={translate("Select main category...", "اختر الفئة الرئيسية...")}
          clearable
          searchable
          radius="md"
        />

        <SelectMaterialSub
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
        <LoadingSection message={translate("Loading materials...", "جاري تحميل المواد...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading materials", "خطأ في تحميل المواد")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedMaterials &&
        (paginatedMaterials.data.length === 0 ? (
          debouncedKeyword || materialTypeFilter || mainCategoryFilter || subCategoryFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No materials found", "لا توجد مواد")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Material Name", "اسم المادة")}</Table.Th>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Type", "النوع")}</Table.Th>
                    <Table.Th>{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                    <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    <Table.Th>{translate("Unit of Measurement", "وحدة القياس")}</Table.Th>
                    <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                    <Table.Th>
                      {translate(`Unit Price (${translation.currency})`, `سعر الوحدة (${translation.currency})`)}
                    </Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedMaterials.data.map((material) => {
                    const categories = getCategoryLabels(material.subCategoryId);
                    return (
                      <UnitToggle
                        key={material.code}
                        baseUnit={material.unitOfMeasurement}
                        unitConversions={material.unitConversions}
                      >
                        {({ unit, factor, toggleButton }) => (
                          <Table.Tr className="text-gray-600">
                            <Table.Td className="font-semibold text-gray-800">
                              <Link
                                href={getLocalizedHref(`/warehouse/materials/${material.code}`)}
                                className="hover:underline"
                              >
                                {material.title}
                              </Link>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono">{material.code}</span>
                                <CopyButton text={material.code} />
                              </div>
                            </Table.Td>
                            <Table.Td>{getMaterialTypeLabel(material.materialType, locale)}</Table.Td>
                            <Table.Td>{categories.main}</Table.Td>
                            <Table.Td>{categories.sub}</Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1">
                                {getMaterialUnitLabel(unit, locale)}
                                {toggleButton}
                              </div>
                            </Table.Td>
                            <Table.Td>{formatBaseQuantityForDisplay(material.quantity, factor)}</Table.Td>
                            <Table.Td>{formatMoney(toDisplayUnitPrice(material.unitPrice, factor))}</Table.Td>
                            <Table.Td w={0}>
                              <PermissionGuard permission={PERMISSIONS.UPDATE_MATERIAL}>
                                <button
                                  onClick={() => handleOpenUpdateModal(material)}
                                  className="rounded-lg bg-gray-100 p-1.5 transition-colors hover:bg-gray-200"
                                >
                                  <Pencil size={14} />
                                </button>
                              </PermissionGuard>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </UnitToggle>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<MaterialWithUnitConversions>
              paginatedData={paginatedMaterials}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      <MaterialModal
        opened={modalOpened}
        close={closeModal}
        materialToUpdate={materialToUpdate}
        setMaterialToUpdate={setMaterialToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!materialToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />

      <PrintMaterialsModal opened={printModalOpened} close={closePrintModal} />
    </LayoutBox>
  );
}
