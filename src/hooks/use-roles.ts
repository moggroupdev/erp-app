import { useQuery } from "@tanstack/react-query";
import useUser from "@/contexts/user/hook";
import { useLocale } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";

export default function useRoles() {
  const locale = useLocale();
  const { isInitializing, user } = useUser();
  const privateRequest = usePrivateRequest();

  const query = useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: ({ signal }) => rolesApi.list({ privateRequest, signal }),
    enabled: !isInitializing && !!user,
    staleTime: staleTimes.roles,
  });

  return {
    data: query.data || [],
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
  };
}
