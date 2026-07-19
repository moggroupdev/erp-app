import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/hooks";
import categoriesApi from "@/lib/api/categories";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { MaterialCategories, MaterialCategoryMain, MaterialCategorySub } from "@/types/categories";

export default function useMaterialCategories() {
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.categories.material,
    queryFn: () => categoriesApi.getMaterialCategories(),
    staleTime: staleTimes.categories,
    retry: 1,
  });

  const data: MaterialCategories | null = query.data ?? null;

  const getMaterialCategoryMainById = useCallback(
    (id: string | null | undefined): MaterialCategoryMain | null => {
      if (!id || !data) return null;
      return data.materialCategoryMains.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getMaterialCategorySubById = useCallback(
    (id: string | null | undefined): MaterialCategorySub | null => {
      if (!id || !data) return null;
      return data.materialCategorySubs.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getMaterialSubcategoriesOfMain = useCallback(
    (mainCategoryId: string | null | undefined): MaterialCategorySub[] => {
      if (!mainCategoryId || !data) return [];
      return data.materialCategorySubs.filter((item) => item.mainCategoryId === mainCategoryId);
    },
    [data],
  );

  const helpers = useMemo(
    () => ({
      getMaterialCategoryMainById,
      getMaterialCategorySubById,
      getMaterialSubcategoriesOfMain,
    }),
    [getMaterialCategoryMainById, getMaterialCategorySubById, getMaterialSubcategoriesOfMain],
  );

  return {
    data,
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
    helpers,
  };
}
