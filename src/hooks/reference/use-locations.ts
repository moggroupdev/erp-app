import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/hooks";
import locationsApi from "@/lib/api/locations";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { City, Country, Governorate } from "@/types/locations";

export default function useLocations() {
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.locations.all,
    queryFn: () => locationsApi.getLocations(),
    staleTime: staleTimes.locations,
    retry: 1,
  });

  const data = query.data || null;

  const getCountryById = useCallback(
    (id: string | null | undefined): Country | null => {
      if (!id || !data) return null;
      return data.countries.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getGovernorateById = useCallback(
    (id: string | null | undefined): Governorate | null => {
      if (!id || !data) return null;
      return data.governorates.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getCityById = useCallback(
    (id: string | null | undefined): City | null => {
      if (!id || !data) return null;
      return data.cities.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getGovernorateOfCity = useCallback(
    (cityId: string | null | undefined): Governorate | null => {
      if (!cityId || !data) return null;

      const city = data.cities.find((item) => item.id === cityId);
      if (!city) return null;

      return data.governorates.find((item) => item.id === city.governorateId) ?? null;
    },
    [data],
  );

  const getCitiesOfGovernorate = useCallback(
    (governorateId: string | null | undefined): City[] => {
      if (!governorateId || !data) return [];
      return data.cities.filter((item) => item.governorateId === governorateId);
    },
    [data],
  );

  const helpers = useMemo(
    () => ({
      getCountryById,
      getGovernorateById,
      getCityById,
      getGovernorateOfCity,
      getCitiesOfGovernorate,
    }),
    [getCountryById, getGovernorateById, getCityById, getGovernorateOfCity, getCitiesOfGovernorate],
  );

  return {
    data,
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
    helpers,
  };
}
