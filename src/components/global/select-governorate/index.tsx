import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useLocations from "@/contexts/locations/hook";

export type SelectGovernorateProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectGovernorate(props: SelectGovernorateProps) {
  const { data, loading, error } = useLocations();

  const labelsList = data
    ? data.governorates.map((governorate) => ({
        value: governorate.id,
        label: { en: governorate.nameEn, ar: governorate.nameAr },
      }))
    : [];

  return <LocalizedSelect {...props} labelsList={labelsList} disabled={loading} error={error} />;
}
