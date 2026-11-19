"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Table, TextInput } from "@mantine/core";
import { ArchiveRestore, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import materialsApi from "@/lib/api/materials";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import type { DeletedMaterial } from "@/types/material";
import ProtectedLink from "@/components/ui/protected-link";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import PaginationHandler from "@/components/ui/pagination-handler";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import RestoreMaterialModal from "../components/restore-material-modal";

const PAGE_TITLE = { en: "Deleted Items", ar: "الأصناف المحذوفة" };

const MATERIALS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
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

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
  };

  const params = { limit: MATERIALS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters = activePage !== 1 || !!debouncedKeyword;

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
  });

  const {
    data: paginatedMaterials,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materials.deletedList(params),
    queryFn: ({ signal }) => materialsApi.listDeleted({ privateRequest, params, signal }),
    staleTime: staleTimes.materials,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword]);

  const [restoreModalOpened, { open: openRestoreModal, close: closeRestoreModal }] = useDisclosure(false);
  const [materialToRestore, setMaterialToRestore] = useState<DeletedMaterial | null>(null);

  function handleOpenRestoreModal(material: DeletedMaterial) {
    setMaterialToRestore(material);
    openRestoreModal();
  }

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      <TextInput
        value={keyword}
        onChange={(e) => setPendingKeyword(e.currentTarget.value)}
        placeholder={translate("Search for a deleted item...", "ابحث عن صنف محذوف...")}
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

      {isFetching ? (
        <LoadingSection message={translate("Loading deleted items...", "جاري تحميل الأصناف المحذوفة...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading deleted items", "خطأ في تحميل الأصناف المحذوفة")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedMaterials &&
        (paginatedMaterials.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No deleted items found", "لا توجد أصناف محذوفة")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Item Name", "اسم الصنف")}</Table.Th>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Type", "النوع")}</Table.Th>
                    <Table.Th>{translate("Main Category", "الفئة الرئيسية")}</Table.Th>
                    <Table.Th>{translate("Subcategory", "الفئة الفرعية")}</Table.Th>
                    <Table.Th>{translate("Deleted At", "تاريخ الحذف")}</Table.Th>
                    <Table.Th>{translate("Deleted By", "حُذف بواسطة")}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedMaterials.data.map((material) => {
                    const categories = getCategoryLabels(material.subCategoryId);
                    return (
                      <Table.Tr key={material.code} className="text-gray-600">
                        <Table.Td className="font-semibold text-gray-800">
                          <ProtectedLink
                            permission={PERMISSIONS.READ_MATERIALS}
                            href={`/warehouse/materials/${material.code}`}
                            className="hover:underline"
                          >
                            {material.title}
                          </ProtectedLink>
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
                        <Table.Td>{formatDateAndTime(material.deletedAt, locale)}</Table.Td>
                        <Table.Td>{material.deletedByName || "-"}</Table.Td>
                        <Table.Td w={0}>
                          <PermissionGuard permission={PERMISSIONS.RESTORE_MATERIAL}>
                            <button
                              type="button"
                              onClick={() => handleOpenRestoreModal(material)}
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-700 transition-colors hover:bg-teal-100"
                              title={translate("Restore item", "استعادة الصنف")}
                            >
                              <ArchiveRestore size={14} />
                            </button>
                          </PermissionGuard>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<DeletedMaterial>
              paginatedData={paginatedMaterials}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      <RestoreMaterialModal
        opened={restoreModalOpened}
        close={() => {
          closeRestoreModal();
          setMaterialToRestore(null);
        }}
        material={materialToRestore}
        onSuccess={() => {
          if (hasActiveFilters && paginatedMaterials?.data.length === 1) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
