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
import suppliersApi from "@/lib/api/suppliers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type Supplier } from "@/types/supplier";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { Button, Table, TextInput } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import { Pencil, Plus, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import PrintDocument from "@/components/ui/print-document";
import SuppliersListPrintDocument from "@/components/documents/suppliers-list-print-document";
import SupplierModal from "@/components/global/data-modals/supplier-modal";
import SelectSupplierClassification from "@/components/global/selections/enum-based/select-supplier-classification";
import { getSupplierClassificationLabel } from "@/lib/constants/enums/supplier-classifications";

const PAGE_TITLE = { en: "Suppliers", ar: "الموردون" };

const SUPPLIERS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();
  const printDate = formatDate(new Date(), locale);

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
  const [classificationFilter, setClassificationFilter] = useState<string | null>(
    urlSearchParams.get("classification") || null,
  );

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    classification: classificationFilter,
  };

  const params = { limit: SUPPLIERS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters: boolean = !!(activePage !== 1 || debouncedKeyword || classificationFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setClassificationFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
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
  });

  // Only used for printing
  const { data: allSuppliers, refetch: fetchAllSuppliers } = useQuery({
    queryKey: queryKeys.suppliers.list({ limit: "list-all-to-print" }),
    queryFn: ({ signal }) => suppliersApi.listAllToPrint({ privateRequest, signal }),
    staleTime: staleTimes.suppliers,
    enabled: false, // Disabled by default, will be enabled when the print button is clicked
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, classificationFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, classificationFilter]);

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [supplierToUpdate, setSupplierToUpdate] = useState<Supplier | null>(null);

  function handleOpenUpdateModal(supplier: Supplier) {
    setSupplierToUpdate(supplier);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/procurement"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-2">
            <PermissionGuard permission={PERMISSIONS.PRINT_SUPPLIERS_LIST}>
              <div className="flex-center px-1">
                <PrintDocument
                  buttonType="icon"
                  title={translate(`Suppliers List - ${printDate}`, `قائمة الموردين - ${printDate}`)}
                  onBeforePrint={async () => {
                    if (!allSuppliers) await fetchAllSuppliers();
                  }}
                >
                  {allSuppliers && <SuppliersListPrintDocument suppliers={allSuppliers} />}
                </PrintDocument>
              </div>
            </PermissionGuard>
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_SUPPLIER}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add New Supplier", "إضافة مورد جديد")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
        <div className="col-span-1 md:col-span-3">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search for a supplier...", "ابحث عن مورد...")}
            leftSection={<Search size={15} />}
            radius="md"
            rightSection={
              keyword && (
                <button onClick={() => setImmediateKeyword("")}>
                  <X size={15} />
                </button>
              )
            }
          />
        </div>

        <SelectSupplierClassification
          value={classificationFilter}
          setValue={setClassificationFilter}
          placeholder={translate("Select classification...", "اختر التصنيف...")}
          searchable
          clearable
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading suppliers...", "جاري تحميل الموردين...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading suppliers", "خطأ في تحميل الموردين")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedSuppliers &&
        (paginatedSuppliers.data.length === 0 ? (
          debouncedKeyword || classificationFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No suppliers found", "لا يوجد موردون")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Name", "الاسم")}</Table.Th>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Classification", "التصنيف")}</Table.Th>
                    <Table.Th>{translate("Phone", "الهاتف")}</Table.Th>
                    <Table.Th>{translate("Email", "البريد الإلكتروني")}</Table.Th>
                    <Table.Th>{translate("Registration Date", "تاريخ التسجيل")}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedSuppliers.data.map((supplier) => (
                    <Table.Tr key={supplier.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <Link href={getLocalizedHref(`/procurement/suppliers/${supplier.id}`)} className="hover:underline">
                          {supplier.name}
                        </Link>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{supplier.code}</span>
                          <CopyButton text={supplier.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {supplier.classification ? getSupplierClassificationLabel(supplier.classification, locale) : "-"}
                      </Table.Td>
                      <Table.Td>{supplier.phone || "-"}</Table.Td>
                      <Table.Td>{supplier.email || "-"}</Table.Td>
                      <Table.Td>{formatDateAndTime(supplier.createdAt, locale)}</Table.Td>
                      <Table.Td w={0}>
                        <PermissionGuard permission={PERMISSIONS.UPDATE_SUPPLIER}>
                          <button
                            onClick={() => handleOpenUpdateModal(supplier)}
                            className="rounded-lg bg-gray-100 p-1.5 transition-colors hover:bg-gray-200"
                          >
                            <Pencil size={14} />
                          </button>
                        </PermissionGuard>
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
        ))
      )}

      <SupplierModal
        opened={modalOpened}
        close={closeModal}
        supplierToUpdate={supplierToUpdate}
        setSupplierToUpdate={setSupplierToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!supplierToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
