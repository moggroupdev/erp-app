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
import customersApi from "@/lib/api/customers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
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
import RefetchButton from "@/components/ui/refetch-button";
import CustomerModal from "@/components/global/data-modals/customer-modal";
import SelectCustomerClassification from "@/components/global/selections/enum-based/select-customer-classification";
import { getCustomerClassificationLabel } from "@/lib/constants/enums/customer-classifications";

const PAGE_TITLE = { en: "Customers", ar: "العملاء" };

const CUSTOMERS_PER_PAGE = 25;

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
  const [classificationFilter, setClassificationFilter] = useState<string | null>(
    urlSearchParams.get("classification") || null,
  );

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    classification: classificationFilter,
  };

  const params = { limit: CUSTOMERS_PER_PAGE, ...removeEmptyParams(urlParams) };

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
    data: paginatedCustomers,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: ({ signal }) => customersApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.customers,
    placeholderData: keepPreviousData,
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
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_CUSTOMER}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add New Customer", "إضافة عميل جديد")}
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
        </div>

        <SelectCustomerClassification
          value={classificationFilter}
          setValue={setClassificationFilter}
          placeholder={translate("Select classification...", "اختر التصنيف...")}
          searchable
          clearable
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading customers...", "جاري تحميل العملاء...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading customers", "خطأ في تحميل العملاء")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedCustomers &&
        (paginatedCustomers.data.length === 0 ? (
          debouncedKeyword || classificationFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No customers found", "لا يوجد عملاء")} />
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
                      <Table.Td>
                        {customer.classification ? getCustomerClassificationLabel(customer.classification, locale) : "-"}
                      </Table.Td>
                      <Table.Td>{customer.phone || "-"}</Table.Td>
                      <Table.Td>{customer.email || "-"}</Table.Td>
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

            <PaginationHandler<Customer>
              paginatedData={paginatedCustomers}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}

      <CustomerModal
        opened={modalOpened}
        close={closeModal}
        customerToUpdate={customerToUpdate}
        setCustomerToUpdate={setCustomerToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!customerToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
