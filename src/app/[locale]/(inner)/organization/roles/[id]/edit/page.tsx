"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import RoleForm from "../../components/role-form";

const PAGE_TITLE = { en: "Edit Role", ar: "تعديل الدور" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();
  const privateRequest = usePrivateRequest();

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

  useDocumentTitle(
    `${role?.name ? `${translate("Edit", "تعديل")} ${role.name}` : translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Roles", "الأدوار")}`,
  );

  return (
    <div className="root-flex-1 flex h-full flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(getLocalizedHref(`/organization/roles/${id}`))}
            title={translate("Back", "رجوع")}
            variant="light"
            color="dark"
            radius={20}
            p={0}
            h={40}
            w={40}
          >
            <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0", "180deg")})` }} />
          </Button>
          <h1>{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
        </div>
        <p className="text-gray-500">
          {translate(
            "Update the role details and permissions. Changes apply immediately to all assigned users.",
            "حدّث تفاصيل الدور والصلاحيات. تُطبَّق التغييرات فورًا على جميع المستخدمين المعيّنين.",
          )}
        </p>
      </header>

      {isFetching && !role ? (
        <LoadingSection message={translate("Loading role...", "جاري تحميل الدور...")} />
      ) : errorMessage && !role ? (
        <ErrorSection
          errorTitle={translate("Error loading role", "خطأ في تحميل الدور")}
          errorMessage={errorMessage}
          button={{ text: translate("Try again", "حاول مرة أخرى"), onClick: () => refetch() }}
        />
      ) : (
        role && (
          <RoleForm
            key={role.id}
            mode="edit"
            roleId={role.id}
            initialValues={{
              name: role.name,
              description: role.description,
              maxDiscountPct: role.maxDiscountPct,
              departmentId: role.departmentId,
              permissions: role.permissions,
            }}
          />
        )
      )}
    </div>
  );
}
