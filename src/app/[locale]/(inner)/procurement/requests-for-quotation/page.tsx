"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Badge, Menu, Table, TextInput } from "@mantine/core";
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
import DataSelect from "@/components/ui/data-select";
import { EmptyValue } from "@/components/ui/entity-details";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import requestForQuotationsApi from "@/lib/api/request-for-quotations";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import getErrorMessage from "@/lib/helpers/get-error-message";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import type { RequestForQuotationListItem } from "@/types/request-for-quotation";
import { getRequestForQuotationStatus, getRequestForQuotationStatusLabel } from "./helpers";

const PAGE_TITLE = { en: "Requests for Quotation", ar: "طلبات عروض الأسعار" };
const PAGE_SIZE = 25;

export default function Page() {
  const { locale, translate } = useI18n();
  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const canAdd = useHasPermission(PERMISSIONS.ADD_REQUEST_FOR_QUOTATION);

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const [status, setStatus] = useState<string | null>(urlSearchParams.get("status") || null);
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    status: status || "",
  };
  const params = { limit: PAGE_SIZE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setStatus(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword, status });

  const {
    data: paginatedRequests,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.requestForQuotations.list(params),
    queryFn: ({ signal }) => requestForQuotationsApi.list({ privateRequest, params, signal }),
    placeholderData: keepPreviousData,
    staleTime: staleTimes.requestForQuotations,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, status };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, status]);

  const statusOptions = [
    { value: "draft", label: translate("Draft", "مسودة") },
    { value: "issued", label: translate("Issued", "صادر") },
    { value: "closed", label: translate("Closed", "مغلق") },
    { value: "cancelled", label: translate("Cancelled", "ملغي") },
  ];

  return (
    <LayoutBox
      header={{
        backLink: true,
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <ActionsMenu>
              {canAdd && (
                <Menu.Item
                  component={Link}
                  href={getLocalizedHref("/procurement/requests-for-quotation/create")}
                  leftSection={<Plus size={14} />}
                >
                  {translate("Create request", "إنشاء طلب")}
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
        <DataSelect
          value={status}
          setValue={setStatus}
          data={statusOptions}
          clearable
          placeholder={translate("Status", "الحالة")}
          className="w-48"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading requests for quotation...", "جاري تحميل طلبات عروض الأسعار...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading requests for quotation", "خطأ في تحميل طلبات عروض الأسعار")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedRequests &&
        (paginatedRequests.data.length === 0 ? (
          debouncedKeyword || status ? (
            <NoResultsSection
              keyword={debouncedKeyword || status || ""}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No requests for quotation found", "لا توجد طلبات عروض أسعار")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Status", "الحالة")}</Table.Th>
                    <Table.Th>{translate("Response deadline", "آخر موعد للرد")}</Table.Th>
                    <Table.Th>{translate("Created by", "أنشأه")}</Table.Th>
                    <Table.Th>{translate("Created", "تاريخ الإنشاء")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedRequests.data.map((request) => {
                    const statusMeta = getRequestForQuotationStatusLabel(getRequestForQuotationStatus(request), translate);
                    return (
                      <Table.Tr key={request.id}>
                        <Table.Td>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={getLocalizedHref(`/procurement/requests-for-quotation/${request.id}`)}
                              className="font-mono hover:underline"
                            >
                              {request.code}
                            </Link>
                            <CopyButton text={request.code} />
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={statusMeta.color} radius="md">
                            {statusMeta.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {request.responseDeadline ? formatDateAndTime(request.responseDeadline, locale) : <EmptyValue />}
                        </Table.Td>
                        <Table.Td>{request.createdBy?.name ?? <EmptyValue />}</Table.Td>
                        <Table.Td>{formatDateAndTime(request.createdAt, locale)}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
            <PaginationHandler<RequestForQuotationListItem>
              paginatedData={paginatedRequests}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
