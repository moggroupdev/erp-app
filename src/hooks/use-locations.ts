import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/hooks";
import locationsApi from "@/lib/api/locations";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";

export default function useLocations() {
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.locations.all,
    queryFn: () => locationsApi.getLocations(),
    staleTime: staleTimes.locations,
    retry: 1,
  });

  return {
    data: query.data || null,
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
  };
}
