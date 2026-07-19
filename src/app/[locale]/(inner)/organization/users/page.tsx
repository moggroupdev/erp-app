"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import usePrivateRequest from "@/hooks/use-private-request";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import usersApi from "@/lib/api/users";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type User } from "@/types/user";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { Badge, Button, Skeleton, Table, TextInput } from "@mantine/core";
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
import SelectDepartment from "@/components/global/select-department";
import SelectRole from "@/components/global/select-role";
import UserModal from "@/components/global/data-modals/user-modal";

const PAGE_TITLE = { en: "Users", ar: "المستخدمون" };

const USERS_PER_PAGE = 25;

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();

  const { helpers: departmentHelpers, loading: departmentsLoading } = useDepartments();
  const { helpers: roleHelpers, loading: rolesLoading } = useRoles();

  const [activePage, setActivePage] = useState(parseInt(urlSearchParams.get("page") || "1"));
  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(urlSearchParams.get("departmentId") || null);
  const [roleFilter, setRoleFilter] = useState<string | null>(urlSearchParams.get("roleId") || null);

  const urlParams = {
    page: activePage.toString(),
    keyword: debouncedKeyword,
    departmentId: departmentFilter,
    roleId: roleFilter,
  };

  const params = { limit: USERS_PER_PAGE, ...removeEmptyParams(urlParams) };

  const hasActiveFilters: boolean = !!(activePage !== 1 || debouncedKeyword || departmentFilter || roleFilter);

  const resetAllFilters = () => {
    setActivePage(1);
    setImmediateKeyword("");
    setDepartmentFilter(null);
    setRoleFilter(null);
  };

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    departmentFilter,
    roleFilter,
  });

  const {
    data: paginatedUsers,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => usersApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.users,
    placeholderData: keepPreviousData,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, departmentFilter, roleFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
      if (activePage !== 1) {
        setActivePage(1);
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, debouncedKeyword, departmentFilter, roleFilter]);

  function handleDepartmentFilterChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(departmentFilter) : value;
    setDepartmentFilter(next);
    setRoleFilter(null);
  }

  function getDepartmentLabel(departmentId: string | null) {
    const department = departmentHelpers.getDepartmentById(departmentId);
    return department ? translate(department.nameEn, department.nameAr) : "";
  }

  function getRoleLabel(roleId: string | null, isAdmin: boolean) {
    if (isAdmin) return translate("Admin", "مسؤول");
    return roleHelpers.getRoleById(roleId)?.name || "";
  }

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);

  function handleOpenUpdateModal(user: User) {
    setUserToUpdate(user);
    openModal();
  }

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate(
          "Manage organization users, roles, and department assignments.",
          "إدارة مستخدمي المؤسسة وأدوارهم وتعييناتهم للأقسام.",
        ),
        sideElements: (
          <div className="flex gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_USER}>
              <Button onClick={openModal} variant="light" color="teal" radius="md" leftSection={<Plus size={15} />}>
                {translate("Add User", "إضافة مستخدم")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-6">
        <div className="col-span-1 md:col-span-4">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search for a user...", "ابحث عن مستخدم...")}
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
        </div>

        <SelectDepartment
          value={departmentFilter}
          setValue={handleDepartmentFilterChange}
          placeholder={translate("Select department...", "اختر القسم...")}
          clearable
          radius="md"
        />

        <SelectRole
          value={roleFilter}
          setValue={setRoleFilter}
          departmentId={departmentFilter || undefined}
          placeholder={translate("Select role...", "اختر الدور...")}
          clearable
          radius="md"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading users...", "جاري تحميل المستخدمين...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading users", "خطأ في تحميل المستخدمين")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        paginatedUsers &&
        (paginatedUsers.data.length === 0 ? (
          debouncedKeyword || departmentFilter || roleFilter ? (
            <NoResultsSection
              keyword={debouncedKeyword || translate("selected filters", "الفلاتر المحددة")}
              button={{ text: translate("View All", "عرض الكل"), onClick: resetAllFilters }}
            />
          ) : (
            <EmptySection useDefaultImg message={translate("No users found", "لا يوجد مستخدمون")} />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{translate("Name", "الاسم")}</Table.Th>
                    <Table.Th>{translate("Code", "الكود")}</Table.Th>
                    <Table.Th>{translate("Phone", "الهاتف")}</Table.Th>
                    <Table.Th>{translate("Email", "البريد الإلكتروني")}</Table.Th>
                    <Table.Th>{translate("Department", "القسم")}</Table.Th>
                    <Table.Th>{translate("Role", "الدور")}</Table.Th>
                    <Table.Th>{translate("Registration Date", "تاريخ التسجيل")}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedUsers.data.map((user) => (
                    <Table.Tr key={user.id} className="text-gray-600">
                      <Table.Td className="font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <Link href={getLocalizedHref(`/organization/users/${user.id}`)} className="hover:underline">
                            {user.name}
                          </Link>
                          {user.isAdmin && (
                            <Badge size="sm" variant="light" color="dark">
                              {translate("Admin", "مسؤول")}
                            </Badge>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{user.code}</span>
                          <CopyButton text={user.code} />
                        </div>
                      </Table.Td>
                      <Table.Td>{user.phone}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>
                        {departmentsLoading ? (
                          <Skeleton height={12} width={90} />
                        ) : (
                          <div className="flex items-end gap-1.5">
                            <span>{getDepartmentLabel(user.departmentId)}</span>
                            {user.productionSubDepartment && (
                              <span className="text-xs text-gray-400">
                                - {getProductionSubDepartmentLabel(user.productionSubDepartment, locale)}
                              </span>
                            )}
                          </div>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {rolesLoading && !user.isAdmin ? (
                          <Skeleton height={12} width={70} />
                        ) : (
                          getRoleLabel(user.roleId, user.isAdmin)
                        )}
                      </Table.Td>
                      <Table.Td>{formatDateAndTime(user.createdAt, locale)}</Table.Td>
                      <Table.Td w={0}>
                        {!user.isAdmin && (
                          <PermissionGuard permission={PERMISSIONS.UPDATE_USER}>
                            <button
                              onClick={() => handleOpenUpdateModal(user)}
                              className="rounded-lg bg-gray-100 p-1.5 transition-colors hover:bg-gray-200"
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGuard>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <PaginationHandler<User> paginatedData={paginatedUsers} activePage={activePage} setActivePage={setActivePage} />
          </>
        ))
      )}

      <UserModal
        opened={modalOpened}
        close={closeModal}
        userToUpdate={userToUpdate}
        setUserToUpdate={setUserToUpdate}
        isForList={true}
        onSuccess={() => {
          if (!userToUpdate && hasActiveFilters) resetAllFilters();
        }}
      />
    </LayoutBox>
  );
}
