"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import useDepartments from "@/hooks/reference/use-departments";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import { Button, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import PermissionGuard from "@/components/guards/permission";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import NoResultsSection from "@/components/ui/sections/no-results";
import RefetchButton from "@/components/ui/refetch-button";
import RoleCard from "./components/role-card";
import useHandlePreviousFilters from "@/hooks/use-handle-previous-filters";
import SelectDepartment from "@/components/global/select-department";

const PAGE_TITLE = { en: "Roles", ar: "الأدوار" };

export default function Page() {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar), "dashboard");

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const privateRequest = usePrivateRequest();
  const { data: departments } = useDepartments();

  const {
    value: keyword,
    debouncedValue: debouncedKeyword,
    setPendingValue: setPendingKeyword,
    setImmediateValue: setImmediateKeyword,
  } = useDebouncedState(urlSearchParams.get("keyword") || "");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(urlSearchParams.get("departmentId") || null);

  const urlParams = { keyword: debouncedKeyword, departmentId: departmentFilter };

  const params = removeEmptyParams(urlParams);

  const { filtersChanged, updatePreviousFilters } = useHandlePreviousFilters({
    debouncedKeyword,
    departmentFilter,
  });

  const {
    data: roles,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: ({ signal }) => rolesApi.list({ privateRequest, params, signal }),
    staleTime: staleTimes.roles,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const department of departments) {
      map.set(department.id, translate(department.nameEn, department.nameAr));
    }
    return map;
  }, [departments, translate]);

  useEffect(() => {
    router.replace(`?` + new URLSearchParams(removeEmptyParams(urlParams)), { scroll: false });

    const newFilters = { debouncedKeyword, departmentFilter };
    if (filtersChanged(newFilters)) {
      updatePreviousFilters(newFilters);
    }

    window.scrollTo({ top: 0, behavior: "instant" });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, departmentFilter]);

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate(
          "View roles and their access permissions across the organization.",
          "عرض الأدوار وصلاحيات الوصول عبر المؤسسة.",
        ),
        sideElements: (
          <div className="flex items-center gap-2">
            <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
            <PermissionGuard permission={PERMISSIONS.ADD_ROLE}>
              <Button
                component={Link}
                href={getLocalizedHref("/organization/roles/new")}
                variant="light"
                color="teal"
                radius="md"
                leftSection={<Plus size={15} />}
              >
                {translate("Add Role", "إضافة دور")}
              </Button>
            </PermissionGuard>
          </div>
        ),
      }}
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
        <div className="col-span-1 md:col-span-4">
          <TextInput
            value={keyword}
            onChange={(e) => setPendingKeyword(e.currentTarget.value)}
            placeholder={translate("Search roles by name or description...", "ابحث عن الأدوار بالاسم أو الوصف...")}
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
          setValue={setDepartmentFilter}
          placeholder={translate("Select department...", "اختر القسم...")}
          clearable
          radius="md"
        />
      </div>

      {isFetching ? (
        <LoadingSection message={translate("Loading roles...", "جاري تحميل الأدوار...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading roles", "خطأ في تحميل الأدوار")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : roles && roles.length === 0 ? (
        debouncedKeyword ? (
          <NoResultsSection
            keyword={debouncedKeyword}
            button={{ text: translate("View All", "عرض الكل"), onClick: () => setImmediateKeyword("") }}
          />
        ) : (
          <EmptySection useDefaultImg message={translate("No roles found", "لا توجد أدوار")} />
        )
      ) : (
        roles && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                departmentName={role.departmentId ? departmentNameById.get(role.departmentId) : null}
              />
            ))}
          </div>
        )
      )}
    </LayoutBox>
  );
}
