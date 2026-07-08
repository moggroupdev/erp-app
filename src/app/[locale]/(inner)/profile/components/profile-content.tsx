"use client";

import { useLocale } from "@/lib/i18n/hooks";
import { createTranslator } from "@/lib/i18n/utils";
import useDataHandler from "@/hooks/use-data-handler";
import handleRequest from "@/lib/helpers/handle-request";
import { User } from "@/types/user";
import authApi from "@/lib/api/auth";
import { Button } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";

export default function ProfileContent() {
  const locale = useLocale();
  const translate = createTranslator(locale);

  const { privateRequest, loading, setLoading, error, setError, data, setData } = useDataHandler<User | null>({
    initialData: null,
  });

  async function handleLoadProfile() {
    handleRequest(locale, setLoading, setError, async () => {
      const user = await authApi.getProfile({ privateRequest });
      setData(user);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={handleLoadProfile} variant="light" radius="md" disabled={loading}>
        {translate("Load Profile", "تحميل الملف الشخصي")}
      </Button>

      {error ? (
        <ErrorAlert error={error} fade />
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
