"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";
import { EmptyValue } from "@/components/ui/entity-details";
import PaginationHandler from "@/components/ui/pagination-handler";
import ProtectedLink from "@/components/ui/protected-link";
import EmptySection from "@/components/ui/sections/empty";
import ErrorSection from "@/components/ui/sections/error";
import LoadingSection from "@/components/ui/sections/loading";
import usePrivateRequest from "@/hooks/use-private-request";
import contractsApi from "@/lib/api/contracts";
import { queryKeys } from "@/lib/api/query-keys";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { staleTimes } from "@/lib/constants/stale-times";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { useI18n } from "@/lib/i18n/hooks";
import type { ContractListItem } from "@/types/contract";

const PAGE_SIZE = 25;

export default function CustomerContractReviews({ customerId }: { customerId: string }) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const [activePage, setActivePage] = useState(1);

  const params = {
    customerId,
    limit: PAGE_SIZE,
    page: activePage,
    sortBy: "-code",
  };

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

  return (
    <section className="mt-4 flex flex-col gap-4">
      <h4 className="text-lg font-semibold text-gray-900">{translate("Contract Reviews", "مراجعات العقود")}</h4>

      {isFetching ? (
        <LoadingSection message={translate("Loading contract reviews...", "جاري تحميل مراجعات العقود...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading contract reviews", "خطأ في تحميل مراجعات العقود")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : paginatedContracts && paginatedContracts.data.length === 0 ? (
        <EmptySection message={translate("No contract reviews found", "لا توجد مراجعات عقود")} />
      ) : (
        paginatedContracts && (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Legacy number", "رقم مراجعة العقد")}</Table.Th>
                    <Table.Th>{translate("Work order number", "رقم أمر الشغل")}</Table.Th>
                    <Table.Th>{translate("Contract date", "تاريخ العقد")}</Table.Th>
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
                      <Table.Td className="font-mono">
                        {contract.legacyNumber ? contract.legacyNumber : <EmptyValue />}
                      </Table.Td>
                      <Table.Td className="font-mono">
                        {contract.legacyWorkOrderNumber ? contract.legacyWorkOrderNumber : <EmptyValue />}
                      </Table.Td>
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
        )
      )}
    </section>
  );
}
