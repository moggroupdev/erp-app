"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import RoleDetails from "./components/role-details";

const PAGE_TITLE = { en: "Role Details", ar: "تفاصيل الدور" };

export default function Page() {
  const { locale, translate } = useI18n();
  const { id } = useParams<{ id: string }>();
  const getLocalizedHref = useLocaleHref();
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
    `${role?.name || translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Roles", "الأدوار")}`,
  );

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        backLink: getLocalizedHref("/organization/roles"),
        sideElements: <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />,
      }}
    >
      {isFetching ? (
        <LoadingSection message={translate("Loading role details...", "جاري تحميل تفاصيل الدور...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading role", "خطأ في تحميل الدور")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
        />
      ) : (
        role && <RoleDetails role={role} />
      )}
    </LayoutBox>
  );
}
