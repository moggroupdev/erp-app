"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import { Building2, Search, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import usersApi, { type UsersPrintFilters } from "@/lib/api/users";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { formatDate } from "@/lib/helpers/date-formaters";
import Modal from "@/components/ui/modal";
import PrintDocument from "@/components/ui/print-document";
import PrintAppliedFiltersPanel, { type PrintFilterItem } from "@/components/ui/print-applied-filters-panel";
import UsersListPrintDocument from "@/components/documents/organization/users-list-print-document";

export default function PrintUsersModal({
  opened,
  close,
  filters = {},
}: {
  opened: boolean;
  close: () => void;
  filters?: UsersPrintFilters;
}) {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { helpers: departmentHelpers } = useDepartments();
  const { helpers: roleHelpers } = useRoles();
  const printDate = formatDate(new Date(), locale);

  const [ignoreFilters, setIgnoreFilters] = useState(false);

  const appliedFilters = removeEmptyParams({
    keyword: filters.keyword,
    departmentId: filters.departmentId,
    roleId: filters.roleId,
  });
  const hasFilters = Object.keys(appliedFilters).length > 0;
  const printFilters = ignoreFilters ? {} : filters;
  const printQueryParams = {
    limit: "list-all-to-print",
    ...(ignoreFilters ? {} : appliedFilters),
  };

  function getDepartmentLabel(departmentId: string | null) {
    const department = departmentHelpers.getDepartmentById(departmentId);
    return department ? translate(department.nameEn, department.nameAr) : "";
  }

  function getRoleLabel(roleId: string | null) {
    return roleHelpers.getRoleById(roleId)?.name || "";
  }

  const filterItems: PrintFilterItem[] = [
    filters.keyword ? { key: "keyword", label: translate("Search", "البحث"), value: filters.keyword, Icon: Search } : null,
    filters.departmentId
      ? {
          key: "departmentId",
          label: translate("Department", "القسم"),
          value: getDepartmentLabel(filters.departmentId) || filters.departmentId,
          Icon: Building2,
        }
      : null,
    filters.roleId
      ? {
          key: "roleId",
          label: translate("Role", "الدور"),
          value: getRoleLabel(filters.roleId) || filters.roleId,
          Icon: Shield,
        }
      : null,
  ].filter((item): item is PrintFilterItem => item !== null);

  const { data: usersToPrint, refetch: fetchUsersToPrint } = useQuery({
    queryKey: queryKeys.users.list(printQueryParams),
    queryFn: ({ signal }) => usersApi.listAllToPrint({ privateRequest, signal, filters: printFilters }),
    staleTime: staleTimes.users,
    enabled: false,
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setIgnoreFilters(false);
    }, 250);
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={translate("Print Users List", "طباعة قائمة المستخدمين")}>
      <div className="flex flex-col gap-3">
        <p className="-mt-1 text-sm text-gray-500">
          {hasFilters && !ignoreFilters
            ? translate(
                "The printed list will match the filters below.",
                "ستطابق القائمة المطبوعة الفلاتر أدناه.",
              )
            : translate(
                "Print the full users list, sorted by name.",
                "طباعة قائمة المستخدمين كاملة، مرتبة حسب الاسم.",
              )}
        </p>

        <PrintAppliedFiltersPanel
          filterItems={filterItems}
          ignoreFilters={ignoreFilters}
          onIgnoreFiltersChange={setIgnoreFilters}
          ignoreLabel={translate("Ignore applied filters and print all users", "تجاهل الفلاتر المطبقة وطباعة كل المستخدمين")}
        />

        <PrintDocument
          title={translate(`Users List - ${printDate}`, `قائمة المستخدمين - ${printDate}`)}
          buttonLabel={translate("Print", "طباعة")}
          onBeforePrint={async () => {
            await fetchUsersToPrint();
          }}
          renderTrigger={({ onClick, loading, label, icon }) => (
            <Button
              onClick={onClick}
              leftSection={icon}
              color="dark"
              variant="light"
              radius="md"
              fullWidth
              disabled={loading}
            >
              {label}
            </Button>
          )}
        >
          {usersToPrint && (
            <UsersListPrintDocument
              users={usersToPrint}
              getDepartmentLabel={getDepartmentLabel}
              getRoleLabel={getRoleLabel}
              appliedFilters={
                ignoreFilters ? [] : filterItems.map(({ label, value }) => ({ label, value }))
              }
            />
          )}
        </PrintDocument>
      </div>
    </Modal>
  );
}
