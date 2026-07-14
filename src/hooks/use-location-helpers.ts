import { useCallback, useMemo } from "react";
import type { City, Country, Governorate } from "@/types/locations";
import useLocations from "@/hooks/use-locations";

export default function useLocationHelpers() {
  const { data: locations } = useLocations();

  const getCountryById = useCallback(
    (id: string | null | undefined): Country | null => {
      if (!id || !locations) return null;
      return locations.countries.find((item) => item.id === id) ?? null;
    },
    [locations],
  );

  const getGovernorateById = useCallback(
    (id: string | null | undefined): Governorate | null => {
      if (!id || !locations) return null;
      return locations.governorates.find((item) => item.id === id) ?? null;
    },
    [locations],
  );

  const getCityById = useCallback(
    (id: string | null | undefined): City | null => {
      if (!id || !locations) return null;
      return locations.cities.find((item) => item.id === id) ?? null;
    },
    [locations],
  );

  const getGovernorateOfCity = useCallback(
    (cityId: string | null | undefined): Governorate | null => {
      if (!cityId || !locations) return null;

      const city = locations.cities.find((item) => item.id === cityId);
      if (!city) return null;

      return locations.governorates.find((item) => item.id === city.governorateId) ?? null;
    },
    [locations],
  );

  const getCitiesOfGovernorate = useCallback(
    (governorateId: string | null | undefined): City[] => {
      if (!governorateId || !locations) return [];
      return locations.cities.filter((item) => item.governorateId === governorateId);
    },
    [locations],
  );

  return useMemo(
    () => ({
      getCountryById,
      getGovernorateById,
      getCityById,
      getGovernorateOfCity,
      getCitiesOfGovernorate,
    }),
    [getCountryById, getGovernorateById, getCityById, getGovernorateOfCity, getCitiesOfGovernorate],
  );
}
