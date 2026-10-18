"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Menu, Table, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import PaginationHandler from "@/components/ui/pagination-handler";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import ProtectedLink from "@/components/ui/protected-link";
import { EmptyValue } from "@/components/ui/entity-details";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import useHasPermission from "@/hooks/use-has-permission";
import usePrivateRequest from "@/hooks/use-private-request";
import contractsApi from "@/lib/api/contracts";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import getErrorMessage from "@/lib/helpers/get-error-message";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { ContractListItem } from "@/types/contract";

const PAGE_TITLE = { en: "Contract Reviews", ar: "مراجعات العقود" };
const PAGE_SIZE = 25;

export default function Page() {
  const { locale, translate, translation } = useI18n();
  const canCreateLegacyContract = useHasPermission(PERMISSIONS.ADD_LEGACY_CONTRACT);
  const getLocalizedHref = useLocaleHref();
  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
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
  const params = { limit: PAGE_SIZE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword });

  const {
    data: paginatedContracts,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.contracts.list(params),
    queryFn: ({ signal }) => contractsApi.list({ privateRequest, params, signal }),
    placeholderData: keepPreviousData,
    staleTime: staleTimes.contracts,
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

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <ActionsMenu>
              {canCreateLegacyContract && (
                <Menu.Item
                  component={Link}
                  href={getLocalizedHref("/sales/contracts/legacy/create")}
                  leftSection={<Plus size={14} />}
                >
                  {translate("Add legacy contract review", "إضافة مراجعة عقد مرحلية")}
                </Menu.Item>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <TextInput
          value={keyword}
          onChange={(event) => setPendingKeyword(event.currentTarget.value)}
          placeholder={translate("Search...", "ابحث...")}
          leftSection={<Search size={15} />}
          radius="md"
          className="min-w-64 flex-1"
          rightSection={
            keyword ? (
              <button type="button" onClick={() => setImmediateKeyword("")}>
                <X size={15} />
              </button>
            ) : undefined
          }
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading contract reviews...", "جاري تحميل مراجعات العقود...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading contract reviews", "خطأ في تحميل مراجعات العقود")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedContracts &&
        (paginatedContracts.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No contract reviews found", "لا توجد مراجعات عقود")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Customer", "العميل")}</Table.Th>
                    <Table.Th>{translate("Legacy number", "رقم مراجعة العقد")}</Table.Th>
                    <Table.Th>{translate("Work order number", "رقم أمر الشغل")}</Table.Th>
                    <Table.Th>{translate(`Total (${translation.currency})`, `الإجمالي (${translation.currency})`)}</Table.Th>
                    <Table.Th>{translate("Created at", "تاريخ الإنشاء")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedContracts.data.map((contract) => (
                    <Table.Tr key={contract.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <ProtectedLink
                            permission={PERMISSIONS.READ_CONTRACTS}
                            href={`/sales/contracts/${contract.id}`}
                            className="font-mono hover:underline"
                          >
                            {contract.code}
                          </ProtectedLink>
                          <CopyButton text={contract.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <ProtectedLink
                          permission={PERMISSIONS.READ_CUSTOMERS}
                          href={`/sales/customers/${contract.customer.id}`}
                          className="hover:underline"
                        >
                          {contract.customer.name}
                        </ProtectedLink>
                      </Table.Td>
                      <Table.Td className="font-mono">
                        {contract.legacyNumber ? contract.legacyNumber : <EmptyValue />}
                      </Table.Td>
                      <Table.Td className="font-mono">
                        {contract.legacyWorkOrderNumber ? contract.legacyWorkOrderNumber : <EmptyValue />}
                      </Table.Td>
                      <Table.Td>{formatMoney(Number(contract.totalAmount))}</Table.Td>
                      <Table.Td>{formatDateAndTime(contract.createdAt, locale)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
            <PaginationHandler<ContractListItem>
              paginatedData={paginatedContracts}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
