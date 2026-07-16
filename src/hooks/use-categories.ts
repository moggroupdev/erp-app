import { useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n/hooks";
import categoriesApi from "@/lib/api/categories";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { staleTimes } from "@/lib/constants/stale-times";
import type {
  Categories,
  MaterialCategoryMain,
  MaterialCategorySub,
  ProductCategoryMain,
  ProductCategorySub,
} from "@/types/categories";

export default function useCategories() {
  const locale = useLocale();

  const [materialQuery, productQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.categories.material,
        queryFn: () => categoriesApi.getMaterialCategories(),
        staleTime: staleTimes.categories,
        retry: 1,
      },
      {
        queryKey: queryKeys.categories.product,
        queryFn: () => categoriesApi.getProductCategories(),
        staleTime: staleTimes.categories,
        retry: 1,
      },
    ],
  });

  const data: Categories | null = useMemo(
    () =>
      materialQuery.data && productQuery.data
        ? {
            materialCategoryMains: materialQuery.data.materialCategoryMains,
            materialCategorySubs: materialQuery.data.materialCategorySubs,
            productCategoryMains: productQuery.data.productCategoryMains,
            productCategorySubs: productQuery.data.productCategorySubs,
          }
        : null,
    [materialQuery.data, productQuery.data],
  );

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

  const getMaterialSubcategoriesOfMain = useCallback(
    (mainCategoryId: string | null | undefined): MaterialCategorySub[] => {
      if (!mainCategoryId || !data) return [];
      return data.materialCategorySubs.filter((item) => item.mainCategoryId === mainCategoryId);
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
      getMaterialCategoryMainById,
      getMaterialCategorySubById,
      getProductCategoryMainById,
      getProductCategorySubById,
      getMaterialSubcategoriesOfMain,
      getProductSubcategoriesOfMain,
    }),
    [
      getMaterialCategoryMainById,
      getMaterialCategorySubById,
      getProductCategoryMainById,
      getProductCategorySubById,
      getMaterialSubcategoriesOfMain,
      getProductSubcategoriesOfMain,
    ],
  );

  const error = materialQuery.error || productQuery.error;

  return {
    data,
    loading: materialQuery.isFetching || productQuery.isFetching,
    error: error ? getErrorMessage(locale, error) : "",
    reload: () => {
      void materialQuery.refetch();
      void productQuery.refetch();
    },
    helpers,
  };
}
