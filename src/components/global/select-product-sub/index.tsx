import LocalizedSelect, { LocalizedSelectProps } from "@/components/ui/localized-select";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { ProductCategorySub } from "@/types/categories";

export type SelectProductSubProps = Omit<LocalizedSelectProps, "labelsList"> & {
  mainCategoryScope?: string | null; // undefined → global scope, null → no scope, "id" → specific scope
};

/**
 * Filters product subcategories based on main category scope
 * - undefined: show all subcategories (global scope)
 * - null: show no subcategories (disabled state)
 * - string: show subcategories matching the main category ID
 */
const filterProductSubsByScope = (
  subs: ProductCategorySub[],
  mainCategoryScope: string | null | undefined,
): ProductCategorySub[] => {
  if (mainCategoryScope === null) return [];
  if (mainCategoryScope === undefined) return subs;
  return subs.filter((sub) => sub.mainCategoryId === mainCategoryScope);
};

export default function SelectProductSub({ mainCategoryScope, ...props }: SelectProductSubProps) {
  const { data, loading, error } = useProductCategories();

  const filteredSubs = filterProductSubsByScope(data?.productCategorySubs || [], mainCategoryScope);

  const labelsList = filteredSubs.map((sub) => ({
    value: sub.id,
    label: { en: sub.title, ar: sub.title },
  }));

  return (
    <LocalizedSelect {...props} labelsList={labelsList} disabled={loading || mainCategoryScope === null} error={error} />
  );
}
