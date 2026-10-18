"use client";

/**
 * Searches products via productsApi.list (`read_products`), including dimensions on each row.
 */

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { ProductWithDimensions } from "@/types/product";
import { Package } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";

export type SelectableProduct = Pick<ProductWithDimensions, "code" | "title" | "sourceType" | "dimensions">;

export type SelectProductProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onProductSelect?: (product: SelectableProduct | null) => void;
};

function productLabel(product: Pick<SelectableProduct, "code" | "title">) {
  return `${product.title} - ${product.code}`;
}

export default function SelectProduct({
  value,
  setValue,
  onProductSelect,
  searchable = true,
  clearable = true,
  ...props
}: SelectProductProps) {
  const { translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");
  const [selectedProduct, setSelectedProduct] = useState<SelectableProduct | null>(null);

  const trimmedSearch = debouncedSearch.trim();
  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: trimmedSearch });

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(listParams),
    queryFn: ({ signal }) => productsApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.products,
    placeholderData: keepPreviousData,
    enabled: trimmedSearch.length > 0,
  });

  const products = trimmedSearch.length > 0 ? (productsQuery.data?.data ?? []) : [];

  useEffect(() => {
    if (!value) {
      setSelectedProduct(null);
      return;
    }

    const fromResults = products.find((product) => product.code === value);
    if (fromResults) {
      setSelectedProduct(fromResults);
      return;
    }

    if (selectedProduct?.code === value) return;

    let cancelled = false;
    productsApi
      .get({ privateRequest, code: value })
      .then((product) => {
        if (cancelled) return;
        setSelectedProduct((current) =>
          current?.code === product.code ? current : { ...product, dimensions: current?.dimensions ?? [] },
        );
      })
      .catch(() => {
        if (!cancelled) setSelectedProduct(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, products]);

  const data = useMemo(() => {
    const byCode = new Map<string, SelectableProduct>();
    for (const product of products) byCode.set(product.code, product);
    if (selectedProduct) byCode.set(selectedProduct.code, selectedProduct);
    return Array.from(byCode.values()).map((product) => ({
      value: product.code,
      label: productLabel(product),
    }));
  }, [products, selectedProduct]);

  function handleChange(next: string | null) {
    setValue(next);
    if (!next) {
      setSelectedProduct(null);
      onProductSelect?.(null);
      return;
    }

    const product = products.find((item) => item.code === next) || (selectedProduct?.code === next ? selectedProduct : null);
    if (product) {
      setSelectedProduct(product);
      onProductSelect?.(product);
    } else onProductSelect?.(null);
  }

  function handleSearchChange(search: string) {
    const selectedLabel = selectedProduct && selectedProduct.code === value ? productLabel(selectedProduct) : null;
    if (selectedLabel && search === selectedLabel) return;
    setSearch(search);
  }

  return (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable}
      clearable={clearable}
      onSearchChange={handleSearchChange}
      rightIcon={<Package size={15} className="pointer-events-none text-gray-400" />}
      filter={({ options }) => options}
      renderOption={({ option }) => {
        const product =
          products.find((item) => item.code === option.value) ||
          (selectedProduct?.code === option.value ? selectedProduct : null);
        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate">{product?.title ?? option.label}</span>
            <span className="shrink-0 text-xs text-gray-400">{product?.code ?? ""}</span>
          </div>
        );
      }}
      nothingFoundMessage={
        !trimmedSearch
          ? translate("Type to search products", "اكتب للبحث عن المنتجات")
          : productsQuery.isFetching
            ? translate("Searching...", "جاري البحث...")
            : translate("No products found", "لا توجد منتجات")
      }
    />
  );
}
