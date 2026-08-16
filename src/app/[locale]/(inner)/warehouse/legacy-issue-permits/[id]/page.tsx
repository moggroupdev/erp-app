"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Badge, Button, Table } from "@mantine/core";
import { Pencil } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { formatQuantity } from "@/lib/helpers/format-quantity";
import type { LegacyIssuePermitItemDetailed } from "@/types/legacy-issue-permit";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import CopyButton from "@/components/ui/copy-button";
import TransactionDetails from "./components/transaction-details";
import LegacyIssuePermitUpdateModal from "./components/legacy-issue-update-modal";
import LegacyIssueItemModal from "./components/legacy-issue-item-modal";

const PAGE_TITLE = { en: "Legacy Transaction Details", ar: "تفاصيل إذن صرف مرحلي" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const privateRequest = usePrivateRequest();
  const getLocalizedHref = useLocaleHref();
  const { helpers } = useMaterialCategories();

  const [headerModalOpened, { open: openHeaderModal, close: closeHeaderModal }] = useDisclosure(false);
  const [itemModalOpened, { open: openItemModal, close: closeItemModal }] = useDisclosure(false);
  const [itemToUpdate, setItemToUpdate] = useState<LegacyIssuePermitItemDetailed | null>(null);

  function getMainCategoryTitle(subCategoryId: string) {
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return main?.title || "-";
  }

  const {
    data: transaction,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.legacyIssuePermits.detail(id),
    queryFn: ({ signal }) => legacyIssuePermitsApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.legacyIssuePermits,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useDocumentTitle(
    `${transaction?.issuePermitNumber || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Legacy Issue Permits", "أذونات الصرف المرحلية")}`,
  );

  function handleEditItem(item: LegacyIssuePermitItemDetailed) {
    setItemToUpdate(item);
    openItemModal();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/warehouse/legacy-issue-permits"),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            {transaction && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT}>
                <Button onClick={openHeaderModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
                  {translate("Edit", "تعديل")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading transaction data", "جاري تحميل بيانات الحركة")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading transaction data", "حدث خطأ أثناء تحميل بيانات الحركة")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        transaction && (
          <>
            <TransactionDetails transaction={transaction} />

            <section className="mt-4 flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

              {transaction.items.length === 0 ? (
                <EmptySection message={translate("No items in this transaction", "لا توجد بنود في هذه الحركة")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{translate("Material", "المادة")}</Table.Th>
                        <Table.Th>{translate("Code", "الكود")}</Table.Th>
                        <Table.Th>{translate("Category", "الفئة")}</Table.Th>
                        <Table.Th>{translate("Unit", "الوحدة")}</Table.Th>
                        <Table.Th>{translate("Quantity", "الكمية")}</Table.Th>
                        <Table.Th>{translate("Notes", "الملاحظات")}</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {transaction.items.map((item) => (
                        <Table.Tr key={item.id} className="text-gray-600">
                          <Table.Td className="font-semibold text-gray-800">
                            <Link
                              href={getLocalizedHref(`/warehouse/materials/${item.material.code}`)}
                              className="hover:underline"
                            >
                              {item.material.title}
                            </Link>
                          </Table.Td>
                          <Table.Td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{item.material.code}</span>
                              <CopyButton text={item.material.code} />
                            </div>
                          </Table.Td>
                          <Table.Td>{getMainCategoryTitle(item.material.subCategoryId)}</Table.Td>
                          <Table.Td>
                            <div className="flex items-center gap-1.5">
                              {getMaterialUnitLabel(item.unitOfMeasurementSelected, locale)}
                              {item.unitOfMeasurementSelected !== item.material.unitOfMeasurement && (
                                <Badge size="xs" variant="light" color="gray" radius="md">
                                  {translate("Selected", "مختارة")}
                                </Badge>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>{formatQuantity(item.quantity)}</Table.Td>
                          <Table.Td className="max-w-xs truncate">
                            {item.notes || <span className="text-gray-400">-</span>}
                          </Table.Td>
                          <Table.Td>
                            <PermissionGuard permission={PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT}>
                              <Button
                                variant="subtle"
                                color="gray"
                                size="xs"
                                radius="md"
                                p={6}
                                onClick={() => handleEditItem(item)}
                                title={translate("Edit item", "تعديل البند")}
                              >
                                <Pencil size={14} />
                              </Button>
                            </PermissionGuard>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </section>

            <LegacyIssuePermitUpdateModal opened={headerModalOpened} close={closeHeaderModal} transaction={transaction} />
            <LegacyIssueItemModal
              opened={itemModalOpened}
              close={closeItemModal}
              transactionId={transaction.id}
              itemToUpdate={itemToUpdate}
              setItemToUpdate={setItemToUpdate}
              excludeMaterialCodes={transaction.items.map((item) => item.materialCode)}
            />
          </>
        )
      )}
    </LayoutBox>
  );
}
