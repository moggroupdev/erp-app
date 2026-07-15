import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useUser from "@/contexts/user/hook";
import { useLocale } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import departmentsApi from "@/lib/api/departments";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { Department } from "@/types/departments";

const EMPTY_DEPARTMENTS: Department[] = [];

export default function useDepartments() {
  const locale = useLocale();
  const { isInitializing, user } = useUser();
  const privateRequest = usePrivateRequest();

  const query = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: ({ signal }) => departmentsApi.list({ privateRequest, signal }),
    enabled: !isInitializing && !!user,
    staleTime: staleTimes.departments,
  });

  const data = query.data ?? EMPTY_DEPARTMENTS;

  const getDepartmentById = useCallback(
    (id: string | null | undefined): Department | null => {
      if (!id) return null;
      return data.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const helpers = useMemo(() => ({ getDepartmentById }), [getDepartmentById]);

  return {
    data,
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
    helpers,
  };
}
