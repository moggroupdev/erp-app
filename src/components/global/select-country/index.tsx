import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useLocations from "@/contexts/locations/hook";

export type SelectCountryProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectCountry(props: SelectCountryProps) {
  const { data, loading, error } = useLocations();

  const labelsList = data
    ? data.countries.map((country) => ({
        value: country.id,
        label: { en: country.nameEn, ar: country.nameAr },
      }))
    : [];

  return <LocalizedSelect {...props} labelsList={labelsList} disabled={loading} error={error} />;
}
