"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useHasPermission from "@/hooks/use-has-permission";
import useDepartments from "@/hooks/reference/use-departments";
import usersApi from "@/lib/api/users";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { Badge, Skeleton, Table } from "@mantine/core";
import { Users } from "lucide-react";
import EmptySection from "@/components/ui/sections/empty";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import PaginationHandler from "@/components/ui/pagination-handler";
import CopyButton from "@/components/ui/copy-button";
import { EmptyValue } from "@/components/ui/entity-details";

const USERS_PER_PAGE = 25;

export default function RoleUsersSection({ roleId }: { roleId: string }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const privateRequest = usePrivateRequest();
  const canReadUsers = useHasPermission(PERMISSIONS.READ_USERS);
  const { helpers: departmentHelpers, loading: departmentsLoading } = useDepartments();

  const [activePage, setActivePage] = useState(1);

  const params = { roleId, page: activePage, limit: USERS_PER_PAGE };

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => usersApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.users,
    enabled: canReadUsers,
    placeholderData: keepPreviousData,
  });

  if (!canReadUsers) return null;

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;
  const isFetching = usersQuery.isFetching;
  const errorMessage = usersQuery.error ? getErrorMessage(locale, usersQuery.error) : "";
  const totalRecords = pagination?.totalRecords ?? users.length;

  function getDepartmentLabel(departmentId: string | null) {
    const department = departmentHelpers.getDepartmentById(departmentId);
    return department ? translate(department.nameEn, department.nameAr) : null;
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-haze-100 bg-haze-50 text-haze-600">
            <Users size={18} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">{translate("Users", "المستخدمون")}</h4>
            <p className="mt-0.5 text-sm text-gray-500">
              {translate("Users assigned to this role.", "المستخدمون المعيّنون لهذا الدور.")}
            </p>
          </div>
        </div>
        <Badge size="sm" variant="light" color="haze" radius="md">
          {totalRecords}
        </Badge>
      </div>

      {isFetching && !usersQuery.data ? (
        <LoadingSection message={translate("Loading users...", "جاري تحميل المستخدمين...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading users", "خطأ في تحميل المستخدمين")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => usersQuery.refetch() }}
        />
      ) : users.length === 0 ? (
        <EmptySection message={translate("No users have this role.", "لا يوجد مستخدمون بهذا الدور.")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="text-nowrap" verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{translate("Name", "الاسم")}</Table.Th>
                  <Table.Th>{translate("Code", "الكود")}</Table.Th>
                  <Table.Th>{translate("Job Title", "الوظيفة")}</Table.Th>
                  <Table.Th>{translate("Department", "القسم")}</Table.Th>
                  <Table.Th>{translate("Email", "البريد الإلكتروني")}</Table.Th>
                  <Table.Th>{translate("Phone", "الهاتف")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.id} className="text-gray-600">
                    <Table.Td className="font-semibold text-gray-800">
                      <Link href={getLocalizedHref(`/organization/users/${user.id}`)} className="hover:underline">
                        {user.name}
                      </Link>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{user.code}</span>
                        <CopyButton text={user.code} />
                      </div>
                    </Table.Td>
                    <Table.Td>{user.jobTitle || <EmptyValue />}</Table.Td>
                    <Table.Td>
                      {departmentsLoading ? (
                        <Skeleton height={12} width={90} />
                      ) : (
                        getDepartmentLabel(user.departmentId) || <EmptyValue />
                      )}
                    </Table.Td>
                    <Table.Td>{user.email || <EmptyValue />}</Table.Td>
                    <Table.Td>{user.phone || <EmptyValue />}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          {usersQuery.data && (
            <PaginationHandler paginatedData={usersQuery.data} activePage={activePage} setActivePage={setActivePage} />
          )}
        </>
      )}
    </section>
  );
}
