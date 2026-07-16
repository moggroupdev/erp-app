import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useCategories from "@/hooks/use-categories";

export type SelectProductMainProps = Omit<LocalizedSelectProps, "labelsList">;

export default function SelectProductMain(props: SelectProductMainProps) {
  const { data, loading, error } = useCategories();

  const labelsList = data
    ? data.productCategoryMains.map((main) => ({
        value: main.id,
        label: { en: main.title, ar: main.title },
      }))
    : [];

  return <LocalizedSelect {...props} labelsList={labelsList} disabled={loading} error={error} />;
}
