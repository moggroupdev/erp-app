"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Button, Menu } from "@mantine/core";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import DeleteModal from "@/components/ui/delete-modal";
import RoleDetails from "./components/role-details";
import RoleUsersSection from "./components/role-users-section";

const PAGE_TITLE = { en: "Role Details", ar: "تفاصيل الدور" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const queryClient = useQueryClient();
  const canReadUsers = useHasPermission(PERMISSIONS.READ_USERS);
  const canUpdateRole = useHasPermission(PERMISSIONS.UPDATE_ROLE);

  const {
    data: role,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: ({ signal }) => rolesApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.roles,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";
  const showPageLoader = isFetching && !role;

  useDocumentTitle(`${role?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Roles", "الأدوار")}`);

  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!role) return;
      await rolesApi.delete({ privateRequest, id: role.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      router.push(getLocalizedHref("/organization/roles"));
    },
  });

  const deleteError = deleteMutation.error ? getErrorMessage(locale, deleteMutation.error) : "";
  const hasAssignedUsers = (role?.assignedUserCount ?? 0) > 0;

  function handleRetry() {
    refetch();
    if (canReadUsers) queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
  }

  function handleCloseDeleteModal() {
    closeDeleteModal();
    setTimeout(() => {
      deleteMutation.reset();
    }, 250);
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: true,
        sideElements: (
          <div className="flex items-center gap-3">
            <RefetchButton isFetching={isFetching} onRefetch={handleRetry} />
            <ActionsMenu>
              {role && canUpdateRole && (
                <Menu.Item
                  component={Link}
                  href={getLocalizedHref(`/organization/roles/${id}/edit`)}
                  leftSection={<Pencil size={14} />}
                >
                  {translate("Edit role", "تعديل الدور")}
                </Menu.Item>
              )}
            </ActionsMenu>
          </div>
        ),
      }}
    >
      {showPageLoader ? (
        <LoadingSection message={translate("Loading role details...", "جاري تحميل تفاصيل الدور...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading role", "خطأ في تحميل الدور")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: handleRetry }}
        />
      ) : (
        role && (
          <>
            <RoleDetails role={role} />
            <RoleUsersSection roleId={role.id} />

            <PermissionGuard permission={PERMISSIONS.DELETE_ROLE}>
              <section className="mt-4">
                <button
                  type="button"
                  onClick={() => setDangerZoneOpen((open) => !open)}
                  className="flex items-center gap-1 text-xs! text-gray-400 transition-colors hover:text-gray-600"
                >
                  <ChevronDown size={14} className={`transition-transform ${dangerZoneOpen ? "rotate-180" : ""}`} />
                  {translate("Advanced", "خيارات متقدمة")}
                </button>

                {dangerZoneOpen && (
                  <div className="mt-2.5 rounded-xl border border-clay-50 bg-clay-50/40 p-4">
                    <h4 className="text-sm font-semibold text-clay-700">{translate("Delete role", "حذف الدور")}</h4>
                    <p className="mt-1.5 text-sm text-clay-600/80">
                      {translate(
                        "Permanently delete this role. Only allowed when no users are assigned to it.",
                        "حذف هذا الدور نهائيًا. يُسمح بذلك فقط عندما لا يكون أي مستخدم معيّنًا إليه.",
                      )}
                    </p>
                    <Button
                      mt="md"
                      color="clay"
                      variant="light"
                      radius="md"
                      leftSection={<Trash2 size={15} />}
                      onClick={() => {
                        deleteMutation.reset();
                        openDeleteModal();
                      }}
                    >
                      {translate("Delete this role", "حذف هذا الدور")}
                    </Button>
                  </div>
                )}
              </section>
            </PermissionGuard>

            <DeleteModal
              opened={deleteModalOpened}
              onClose={handleCloseDeleteModal}
              title={translate("Delete role?", "حذف الدور؟")}
              subTitle={
                hasAssignedUsers
                  ? translate(
                      `"${role.name}" still has ${role.assignedUserCount} assigned user(s), including deleted accounts. Reassign or remove them before deleting.`,
                      `لا يزال الدور "${role.name}" معيّنًا لـ ${role.assignedUserCount} مستخدم(ين)، بما في ذلك الحسابات المحذوفة. أعد تعيينهم أو أزلهم قبل الحذف.`,
                    )
                  : translate(
                      `You're about to permanently delete "${role.name}".`,
                      `أنت على وشك حذف الدور "${role.name}" نهائيًا.`,
                    )
              }
              warning={
                hasAssignedUsers
                  ? undefined
                  : translate("This action cannot be undone.", "هذا الإجراء لا يمكن التراجع عنه.")
              }
              action={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              error={deleteError}
              disabled={hasAssignedUsers}
            />
          </>
        )
      )}
    </LayoutBox>
  );
}
