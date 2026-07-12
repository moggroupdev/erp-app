import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useLocations from "@/contexts/locations/hook";
import { City } from "@/types/locations";

export type SelectCityProps = Omit<LocalizedSelectProps, "labelsList"> & {
  governorateScope?: string | null; // undefined → global scope, null → no scope, "id" → specific scope
};

/**
 * Filters cities based on governorate scope
 * - undefined: show all cities (global scope)
 * - null: show no cities (disabled state)
 * - string: show cities matching the governorate ID
 */
const filterCitiesByScope = (cities: City[], governorateScope: string | null | undefined): City[] => {
  if (governorateScope === null) return [];
  if (governorateScope === undefined) return cities;
  return cities.filter((city) => city.governorateId === governorateScope);
};

export default function SelectCity({ governorateScope, ...props }: SelectCityProps) {
  const { data, loading, error } = useLocations();

  const filteredCities = filterCitiesByScope(data?.cities || [], governorateScope);

  const labelsList = filteredCities.map((city) => ({
    value: city.id,
    label: { en: city.nameEn, ar: city.nameAr },
  }));

  return (
    <LocalizedSelect {...props} labelsList={labelsList} disabled={loading || governorateScope === null} error={error} />
  );
}
