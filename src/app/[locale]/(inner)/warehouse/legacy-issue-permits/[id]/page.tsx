"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button } from "@mantine/core";
import { Pencil, Plus } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { LegacyIssuePermitItemDetailed } from "@/types/legacy-issue-permit";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import TransactionDetails from "./components/transaction-details";
import LegacyIssuePermitUpdateModal from "./components/legacy-issue-update-modal";
import LegacyIssueItemModal from "./components/legacy-issue-item-modal";
import LegacyIssueItemsTable from "./components/legacy-issue-items-table";

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

  function getMainCategoryTitle(subCategoryId: string | undefined) {
    if (!subCategoryId) return null;
    const sub = helpers.getMaterialCategorySubById(subCategoryId);
    const main = sub ? helpers.getMaterialCategoryMainById(sub.mainCategoryId) : null;
    return main?.title || null;
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

  function handleAddItem() {
    setItemToUpdate(null);
    openItemModal();
  }

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
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

                <PermissionGuard permission={PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT}>
                  <Button onClick={handleAddItem} variant="light" radius="md" leftSection={<Plus size={15} />}>
                    {translate("Add Item", "إضافة بند")}
                  </Button>
                </PermissionGuard>
              </div>

              {transaction.items.length === 0 ? (
                <EmptySection message={translate("No items in this transaction", "لا توجد بنود في هذه الحركة")} />
              ) : (
                <LegacyIssueItemsTable
                  transactionId={transaction.id}
                  items={transaction.items}
                  getMainCategoryTitle={getMainCategoryTitle}
                  onEdit={handleEditItem}
                />
              )}
            </section>

            <LegacyIssuePermitUpdateModal opened={headerModalOpened} close={closeHeaderModal} transaction={transaction} />
            <LegacyIssueItemModal
              opened={itemModalOpened}
              close={closeItemModal}
              transactionId={transaction.id}
              itemToUpdate={itemToUpdate}
              setItemToUpdate={setItemToUpdate}
              excludeMaterialCodes={transaction.items
                .map((item) => item.materialCode)
                .filter((code): code is string => !!code)}
            />
          </>
        )
      )}
    </LayoutBox>
  );
}
