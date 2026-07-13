"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import useDataHandler from "@/hooks/use-data-handler";
import customersApi from "@/lib/api/customers";
import handleRequest from "@/lib/helpers/handle-request";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type PaginatedData } from "@/types/global";
import { type Customer } from "@/types/customer";
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
import CustomerModal from "@/components/global/customer-modal";

const PAGE_TITLE = { en: "Customers", ar: "العملاء" };

const CUSTOMERS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();

  // State management for filters
  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [typeFilter, setTypeFilter] = useState<string | null>(urlSearchParams.get("type") || null);

  const params = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    type: typeFilter,
  };

  const hasActiveFilters: boolean = !!(activePage !== 1 || debouncedKeyword || typeFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setTypeFilter(null);
  };

  // Track the previous filters and check if they have changed to reset the active page to 1.
  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword, typeFilter });

  const {
    privateRequest,
    loading,
    setLoading,
    error,
    setError,
    data: paginatedCustomers,
    setData: setPaginatedCustomers,
  } = useDataHandler<PaginatedData<Customer> | null>({ initialData: null, initialLoading: true });

  // Handle previous requests abortion
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancellationRef = useRef({ canceled: false });
  const abortPreviousRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      cancellationRef.current.canceled = true;
    }
  };

  function handleLoadCustomers() {
    // Cancel any existing request before starting a new one
    abortPreviousRequest();

    // Create new controller and canceled flag for this request
    abortControllerRef.current = new AbortController();
    cancellationRef.current = { canceled: false };

    handleRequest(
      locale,
      setLoading,
      setError,
      async () => {
        const response = await customersApi.list({
          privateRequest,
          params: { limit: CUSTOMERS_PER_PAGE, ...removeEmptyParams(params) },
          signal: abortControllerRef.current!.signal,
        });
        if (!cancellationRef.current.canceled) setPaginatedCustomers(response);
      },
      cancellationRef.current,
    );
  }

  useEffect(() => {
    // Sync URL search params with filters
    router.replace(`?` + new URLSearchParams(removeEmptyParams(params)), { scroll: false });

    // If the filters have changed, reset the active page to 1.
    const newFilters = { debouncedKeyword, typeFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    handleLoadCustomers();

    // Abort request when component unmounts or dependencies change
    return () => abortPreviousRequest();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, typeFilter]);

  // ========== Handle Modals ==========

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [customerToUpdate, setCustomerToUpdate] = useState<Customer | null>(null);

  function handleOpenUpdateModal(customer: Customer) {
    setCustomerToUpdate(customer);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/procurement"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <PermissionGuard permission={PERMISSIONS.ADD_CUSTOMER}>
            <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
              {translate("Add New Customer", "إضافة عميل جديد")}
            </Button>
          </PermissionGuard>
        ),
      }}
    >
      {/* Filters */}

      <TextInput
        value={keyword}
        onChange={(e) => setPendingKeyword(e.currentTarget.value)}
        placeholder={translate("Search for a customer...", "ابحث عن عميل...")}
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

      {/* Content */}
      {loading ? (
        <LoadingSection message={translate("Loading customers...", "جاري تحميل العملاء...")} />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading customers", "خطأ في تحميل العملاء")}
          errorMessage={error}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: handleLoadCustomers }}
        />
      ) : (
        paginatedCustomers &&
        (paginatedCustomers.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: () => setImmediateKeyword("") }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No customers found", "لا يوجد عملاء")} />
          )
        ) : (
          <>
            {/* Table */}
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
                  {paginatedCustomers.data.map((customer) => (
                    <Table.Tr key={customer.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <Link href={getLocalizedHref(`/sales/customers/${customer.id}`)} className="hover:underline">
                          {customer.name}
                        </Link>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{customer.code}</span>
                          <CopyButton text={customer.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>{customer.phone}</Table.Td>
                      <Table.Td>{customer.email}</Table.Td>
                      <Table.Td>{formatDateAndTime(customer.createdAt, locale)}</Table.Td>
                      <Table.Td w={0}>
                        <PermissionGuard permission={PERMISSIONS.UPDATE_CUSTOMER}>
                          <button
                            onClick={() => handleOpenUpdateModal(customer)}
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

            {/* Pagination */}
            <PaginationHandler<Customer>
              paginatedData={paginatedCustomers}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      {/* Modals */}
      <CustomerModal
        opened={modalOpened}
        close={closeModal}
        customerToUpdate={customerToUpdate}
        setCustomerToUpdate={setCustomerToUpdate}
        isForList={true}
        callback={(result) => {
          setPaginatedCustomers((prev) => {
            if (!prev) return null;
            // In case of updating
            if (customerToUpdate)
              return {
                ...prev,
                data: prev.data.map((customer) => (customer.id === customerToUpdate.id ? result : customer)),
              };
            // In case of adding
            if (hasActiveFilters) {
              // If filters are applied, reset them to trigger refetch
              resetAllFilters();
              return prev; // Return current data to prevents TS errors, refetch will handle the update
            } else {
              // If no filters, optimistically add the new entry
              return { ...prev, data: [result, ...prev.data] };
            }
          });
        }}
      />
    </LayoutBox>
  );
}
