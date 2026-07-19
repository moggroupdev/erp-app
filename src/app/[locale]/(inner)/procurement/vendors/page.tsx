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
import vendorsApi from "@/lib/api/vendors";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type Vendor } from "@/types/vendor";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
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
import VendorModal from "@/components/global/vendor-modal";

const PAGE_TITLE = { en: "Vendors", ar: "الموردون" };

const VENDORS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

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

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
  };

  const params = { limit: VENDORS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters: boolean = !!(activePage !== 1 || debouncedKeyword);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword });

  const {
    data: paginatedVendors,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.vendors.list(params),
    queryFn: ({ signal }) => vendorsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.vendors,
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

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [vendorToUpdate, setVendorToUpdate] = useState<Vendor | null>(null);

  function handleOpenUpdateModal(vendor: Vendor) {
    setVendorToUpdate(vendor);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/procurement"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_VENDOR}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add New Vendor", "إضافة مورد جديد")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <TextInput
        value={keyword}
        onChange={(e) => setPendingKeyword(e.currentTarget.value)}
        placeholder={translate("Search for a vendor...", "ابحث عن مورد...")}
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

      {isFetching ? (
        <LoadingSection message={translate("Loading vendors...", "جاري تحميل الموردين...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading vendors", "خطأ في تحميل الموردين")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedVendors &&
        (paginatedVendors.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: () => setImmediateKeyword("") }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No vendors found", "لا يوجد موردون")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Name", "الاسم")}</Table.Th>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Phone", "الهاتف")}</Table.Th>
                    <Table.Th>{translate("Email", "البريد الإلكتروني")}</Table.Th>
                    <Table.Th>{translate("Registration Date", "تاريخ التسجيل")}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedVendors.data.map((vendor) => (
                    <Table.Tr key={vendor.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <Link href={getLocalizedHref(`/procurement/vendors/${vendor.id}`)} className="hover:underline">
                          {vendor.name}
                        </Link>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{vendor.code}</span>
                          <CopyButton text={vendor.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>{vendor.phone}</Table.Td>
                      <Table.Td>{vendor.email}</Table.Td>
                      <Table.Td>{formatDateAndTime(vendor.createdAt, locale)}</Table.Td>
                      <Table.Td w={0}>
                        <PermissionGuard permission={PERMISSIONS.UPDATE_VENDOR}>
                          <button
                            onClick={() => handleOpenUpdateModal(vendor)}
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

            <PaginationHandler<Vendor>
              paginatedData={paginatedVendors}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      <VendorModal
        opened={modalOpened}
        close={closeModal}
        vendorToUpdate={vendorToUpdate}
        setVendorToUpdate={setVendorToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!vendorToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
