"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import usersApi from "@/lib/api/users";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Button } from "@mantine/core";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import DeleteModal from "@/components/ui/delete-modal";
import UserModal from "@/components/global/user-modal";
import UserDetails from "./components/user-details";

const PAGE_TITLE = { en: "User Data", ar: "ملف المستخدم" };

export default function Page() {
  const { locale, translate } = useI18n();

  const getLocalizedHref = useLocaleHref();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const userQuery = useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) => usersApi.get({ privateRequest, id, signal }),
    staleTime: staleTimes.users,
  });

  const user = userQuery.data || null;
  const loading = userQuery.isFetching;
  const errorMessage = userQuery.error ? getErrorMessage(locale, userQuery.error) : "";

  useDocumentTitle(`${user?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Users", "المستخدمون")}`);

  // ========================= MODALS =========================

  const [updateModalOpened, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await usersApi.delete({ privateRequest, id: user.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      router.push(getLocalizedHref("/organization/users"));
    },
  });

  const deleteError = deleteMutation.error ? getErrorMessage(locale, deleteMutation.error) : "";

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
        backLink: getLocalizedHref("/organization/users"),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={loading} onRefetch={() => userQuery.refetch()} />
            {user && !user.isAdmin && !user.deletedAt && (
              <PermissionGuard permission={PERMISSIONS.UPDATE_USER}>
                <Button onClick={openUpdateModal} variant="light" radius="md" leftSection={<Pencil size={15} />}>
                  {translate("Edit", "تعديل")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading user data...", "جاري تحميل ملف المستخدم...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading user data", "حدث خطأ أثناء تحميل ملف المستخدم")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => userQuery.refetch() }}
        />
      ) : (
        user && (
          <>
            <UserModal opened={updateModalOpened} close={closeUpdateModal} userToUpdate={user} setUserToUpdate={() => {}} />

            <UserDetails user={user} />

            {!user.isAdmin && !user.deletedAt && (
              <PermissionGuard permission={PERMISSIONS.DELETE_USER}>
                <section>
                  <button
                    type="button"
                    onClick={() => setDangerZoneOpen((open) => !open)}
                    className="flex items-center gap-1 text-xs! text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <ChevronDown size={14} className={`transition-transform ${dangerZoneOpen ? "rotate-180" : ""}`} />
                    {translate("Advanced", "خيارات متقدمة")}
                  </button>

                  {dangerZoneOpen && (
                    <div className="mt-2.5 rounded-xl border border-red-50 bg-red-50/40 p-4">
                      <h4 className="text-sm font-semibold text-red-700">{translate("Delete user", "حذف المستخدم")}</h4>
                      <p className="mt-1.5 text-sm text-red-600/80">
                        {translate(
                          "Soft-delete this account. The user will no longer appear in active lists.",
                          "حذف هذا الحساب مؤقتًا. لن يظهر المستخدم بعد ذلك في القوائم النشطة.",
                        )}
                      </p>
                      <Button
                        mt="md"
                        color="red"
                        variant="light"
                        radius="md"
                        leftSection={<Trash2 size={15} />}
                        onClick={() => {
                          deleteMutation.reset();
                          openDeleteModal();
                        }}
                      >
                        {translate("Delete this user", "حذف هذا المستخدم")}
                      </Button>
                    </div>
                  )}
                </section>
              </PermissionGuard>
            )}

            <DeleteModal
              opened={deleteModalOpened}
              onClose={handleCloseDeleteModal}
              title={translate("Delete user?", "حذف المستخدم؟")}
              subTitle={translate(
                `You're about to delete "${user.name}". This removes them from active lists.`,
                `أنت على وشك حذف "${user.name}". سيُزال من القوائم النشطة.`,
              )}
              warning={translate("This action cannot be undone.", "هذا الإجراء لا يمكن التراجع عنه.")}
              action={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              error={deleteError}
            />
          </>
        )
      )}
    </LayoutBox>
  );
}
