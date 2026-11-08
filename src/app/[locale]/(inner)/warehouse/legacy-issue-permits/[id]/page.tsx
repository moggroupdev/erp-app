"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Button, Menu } from "@mantine/core";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import legacyIssuePermitsApi from "@/lib/api/legacy-issue-permits";
import getErrorMessage from "@/lib/helpers/get-error-message";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import type { LegacyIssuePermitItemDetailed } from "@/types/legacy-issue-permit";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import TransactionDetails from "./components/transaction-details";
import LegacyIssuePermitUpdateModal from "./components/legacy-issue-update-modal";
import LegacyIssueItemModal from "./components/legacy-issue-item-modal";
import LegacyIssueItemsTable from "./components/legacy-issue-items-table";

const PAGE_TITLE = { en: "Legacy Transaction Details", ar: "تفاصيل إذن صرف مرحلي" };
const DEFAULT_SORT = "-issuePermitNumber";

export default function Page() {
  const { locale, translate } = useI18n();
  const canUpdatePermit = useHasPermission(PERMISSIONS.UPDATE_LEGACY_ISSUE_PERMIT);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const { helpers } = useMaterialCategories();

  const sortBy = searchParams.get("sortBy") || DEFAULT_SORT;
  const keyword = searchParams.get("keyword") || "";
  const neighborParams = removeEmptyParams({ sortBy, keyword });

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

  const {
    data: neighbors,
    isFetching: isNeighborsFetching,
    refetch: refetchNeighbors,
  } = useQuery({
    queryKey: queryKeys.legacyIssuePermits.neighbors(id, neighborParams),
    queryFn: ({ signal }) =>
      legacyIssuePermitsApi.getNeighbors({ privateRequest, id, params: neighborParams, signal }),
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

  function navigateToNeighbor(neighborId: string) {
    const query = new URLSearchParams(neighborParams).toString();
    const path = `/warehouse/legacy-issue-permits/${neighborId}${query ? `?${query}` : ""}`;
    router.replace(getLocalizedHref(path));
  }

  function handleRefetch() {
    void refetch();
    void refetchNeighbors();
  }

  const previous = neighbors?.previous ?? null;
  const next = neighbors?.next ?? null;

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex gap-3">
            <RefetchButton isFetching={isFetching || isNeighborsFetching} onRefetch={handleRefetch} />
            <ActionsMenu>
              {transaction && canUpdatePermit && (
                <Menu.Item leftSection={<Pencil size={14} />} onClick={openHeaderModal}>
                  {translate("Edit issue permit", "تعديل إذن الصرف")}
                </Menu.Item>
              )}
            </ActionsMenu>
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
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRefetch }}
        />
      ) : (
        transaction && (
          <>
            <TransactionDetails
              transaction={transaction}
              headerEnd={
                <div className="flex items-center gap-1 self-center">
                  <Button
                    className="inline-flex! size-10! shrink-0 items-center justify-center p-0! max-sm:size-[34px]! max-sm:[&_svg]:size-4!"
                    variant="light"
                    color="dark"
                    radius={20}
                    p={0}
                    disabled={isNeighborsFetching || !previous}
                    title={
                      previous
                        ? translate(`Previous: ${previous.issuePermitNumber}`, `السابق: ${previous.issuePermitNumber}`)
                        : translate("Previous permit", "الإذن السابق")
                    }
                    onClick={() => previous && navigateToNeighbor(previous.id)}
                  >
                    <ChevronLeft size={18} className="rtl:rotate-180" />
                  </Button>
                  <Button
                    className="inline-flex! size-10! shrink-0 items-center justify-center p-0! max-sm:size-[34px]! max-sm:[&_svg]:size-4!"
                    variant="light"
                    color="dark"
                    radius={20}
                    p={0}
                    disabled={isNeighborsFetching || !next}
                    title={
                      next
                        ? translate(`Next: ${next.issuePermitNumber}`, `التالي: ${next.issuePermitNumber}`)
                        : translate("Next permit", "الإذن التالي")
                    }
                    onClick={() => next && navigateToNeighbor(next.id)}
                  >
                    <ChevronRight size={18} className="rtl:rotate-180" />
                  </Button>
                </div>
              }
            />

            <section className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-semibold text-gray-900">{translate("Items", "البنود")}</h4>

                <ActionsMenu>
                  {canUpdatePermit && (
                    <Menu.Item leftSection={<Plus size={14} />} onClick={handleAddItem}>
                      {translate("Add permit item", "إضافة بند لإذن الصرف")}
                    </Menu.Item>
                  )}
                </ActionsMenu>
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
