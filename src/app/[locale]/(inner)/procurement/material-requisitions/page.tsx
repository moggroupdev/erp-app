"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import materialPurchaseRequisitionsApi from "@/lib/api/material-purchase-requisitions";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type MaterialPurchaseRequisitionListItem } from "@/types/material-purchase-requisition";
import { Button, Table, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import PaginationHandler from "@/components/ui/pagination-handler";
import NoResultsSection from "@/components/ui/sections/no-results";
import CopyButton from "@/components/ui/copy-button";
import RefetchButton from "@/components/ui/refetch-button";
import { getRequisitionStatus, getRequisitionStatusLabel } from "./helpers";

const PAGE_TITLE = { en: "Material Purchase Requisitions", ar: "طلبات شراء الخامات" };

const REQUISITIONS_PER_PAGE = 25;

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

  const params = { limit: REQUISITIONS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({ debouncedKeyword });

  const {
    data: paginatedRequisitions,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.materialPurchaseRequisitions.list(params),
    queryFn: ({ signal }) => materialPurchaseRequisitionsApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.materialPurchaseRequisitions,
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

  return (
    <LayoutBox
      header={{
        backLink: getLocalizedHref("/procurement"),
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_MATERIAL_PURCHASE_REQUISITION}>
              <Button
                radius="md"
                variant="light"
                component={Link}
                href={getLocalizedHref("/procurement/material-requisitions/create")}
                leftSection={<Plus size={15} />}
              >
                {translate("Create", "إنشاء")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <TextInput
        value={keyword}
        onChange={(e) => setPendingKeyword(e.currentTarget.value)}
        placeholder={translate("Search...", "ابحث...")}
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
        <LoadingSection
          message={translate("Loading material purchase requisitions...", "جاري تحميل طلبات شراء الخامات...")}
        />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading material purchase requisitions", "خطأ في تحميل طلبات شراء الخامات")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedRequisitions &&
        (paginatedRequisitions.data.length === 0 ? (
          debouncedKeyword ? (
            <NoResultsSection
              keyword={debouncedKeyword}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection
              useDefaultImg
              message={translate("No material purchase requisitions found", "لا توجد طلبات شراء خامات")}
            />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Production Department", "قسم الانتاج")}</Table.Th>
                    <Table.Th>{translate("Status", "الحالة")}</Table.Th>
                    <Table.Th>{translate("Created By", "أنشئ بواسطة")}</Table.Th>
                    <Table.Th>{translate("Created At", "تاريخ الإنشاء")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedRequisitions.data.map((requisition) => {
                    const status = getRequisitionStatusLabel(getRequisitionStatus(requisition), translate);
                    return (
                      <Table.Tr key={requisition.id} className="text-gray-600">
                        <Table.Td className="font-semibold text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={getLocalizedHref(`/procurement/material-requisitions/${requisition.id}`)}
                              className="font-mono hover:underline"
                            >
                              {requisition.code}
                            </Link>
                            <CopyButton text={requisition.code} />
                          </div>
                        </Table.Td>
                        <Table.Td>{getProductionSubDepartmentLabel(requisition.productionSubDepartment, locale)}</Table.Td>
                        <Table.Td>
                          <span className={status.className}>{status.label}</span>
                        </Table.Td>

                        <Table.Td>
                          <Link
                            href={getLocalizedHref(`/organization/users/${requisition.createdBy.id}`)}
                            className="hover:underline"
                          >
                            {requisition.createdBy.name}
                          </Link>
                        </Table.Td>
                        <Table.Td>{formatDateAndTime(requisition.createdAt, locale)}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<MaterialPurchaseRequisitionListItem>
              paginatedData={paginatedRequisitions}
              activePage={activePage}
              setActivePage={setActivePage}
            />
          </>
        ))
      )}
    </LayoutBox>
  );
}
