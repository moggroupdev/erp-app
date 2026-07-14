"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import authApi from "@/lib/api/auth";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { Button } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";

export default function ProfileContent() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: () => authApi.getProfile({ privateRequest }),
    enabled: false,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={() => refetch()} variant="light" radius="md" disabled={isFetching}>
        {translate("Load Profile", "تحميل الملف الشخصي")}
      </Button>

      {errorMessage ? (
        <ErrorAlert error={errorMessage} fade />
      ) : (
        data && (
          <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-6">
            <p>
              <span className="text-gray-600">{translate("Name", "الاسم")}: </span>
              <span className="text-gray-800">{data.name}</span>
            </p>
            <p>
              <span className="text-gray-600">{translate("Email", "البريد الإلكتروني")}: </span>
              <span className="text-gray-800">{data.email}</span>
            </p>
          </div>
        )
      )}
    </div>
  );
}
