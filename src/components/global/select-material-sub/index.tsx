import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useMaterialCategories from "@/hooks/use-material-categories";
import { MaterialCategorySub } from "@/types/categories";

export type SelectMaterialSubProps = Omit<LocalizedSelectProps, "labelsList"> & {
  mainCategoryScope?: string | null; // undefined → global scope, null → no scope, "id" → specific scope
};

/**
 * Filters material subcategories based on main category scope
 * - undefined: show all subcategories (global scope)
 * - null: show no subcategories (disabled state)
 * - string: show subcategories matching the main category ID
 */
const filterMaterialSubsByScope = (
  subs: MaterialCategorySub[],
  mainCategoryScope: string | null | undefined,
): MaterialCategorySub[] => {
  if (mainCategoryScope === null) return [];
  if (mainCategoryScope === undefined) return subs;
  return subs.filter((sub) => sub.mainCategoryId === mainCategoryScope);
};

export default function SelectMaterialSub({ mainCategoryScope, ...props }: SelectMaterialSubProps) {
  const { data, loading, error } = useMaterialCategories();

  const filteredSubs = filterMaterialSubsByScope(data?.materialCategorySubs || [], mainCategoryScope);

  const labelsList = filteredSubs.map((sub) => ({
    value: sub.id,
    label: { en: sub.title, ar: sub.title },
  }));

  return (
    <LocalizedSelect {...props} labelsList={labelsList} disabled={loading || mainCategoryScope === null} error={error} />
  );
}
