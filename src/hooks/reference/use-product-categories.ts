import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/hooks";
import categoriesApi from "@/lib/api/categories";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type { ProductCategories, ProductCategoryMain, ProductCategorySub } from "@/types/categories";

export default function useProductCategories() {
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.categories.product,
    queryFn: () => categoriesApi.getProductCategories(),
    staleTime: staleTimes.categories,
    retry: 1,
  });

  const data: ProductCategories | null = query.data ?? null;

  const getProductCategoryMainById = useCallback(
    (id: string | null | undefined): ProductCategoryMain | null => {
      if (!id || !data) return null;
      return data.productCategoryMains.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getProductCategorySubById = useCallback(
    (id: string | null | undefined): ProductCategorySub | null => {
      if (!id || !data) return null;
      return data.productCategorySubs.find((item) => item.id === id) ?? null;
    },
    [data],
  );

  const getProductSubcategoriesOfMain = useCallback(
    (mainCategoryId: string | null | undefined): ProductCategorySub[] => {
      if (!mainCategoryId || !data) return [];
      return data.productCategorySubs.filter((item) => item.mainCategoryId === mainCategoryId);
    },
    [data],
  );

  const helpers = useMemo(
    () => ({
      getProductCategoryMainById,
      getProductCategorySubById,
      getProductSubcategoriesOfMain,
    }),
    [getProductCategoryMainById, getProductCategorySubById, getProductSubcategoriesOfMain],
  );

  return {
    data,
    loading: query.isFetching,
    error: query.error ? getErrorMessage(locale, query.error) : "",
    reload: () => query.refetch(),
    helpers,
  };
}
