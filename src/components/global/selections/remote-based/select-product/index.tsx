"use client";

/**
 * Searches products via productsApi.list (`read_products`), including dimensions on each row,
 * and optionally opens a browse modal (search + source type + category filters + results table).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import productsApi from "@/lib/api/products";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { ProductWithDimensions } from "@/types/product";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Package, Table2 } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import BrowseProductsModal from "./browse-products-modal";

export type SelectableProduct = Pick<ProductWithDimensions, "code" | "title" | "sourceType" | "dimensions">;

export type SelectProductProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onProductSelect?: (product: SelectableProduct | null) => void;
  /** Show a button that opens a browse modal for picking a product. */
  withBrowseModal?: boolean;
  /** Inside the browse modal, show Add Product when the user has `ADD_PRODUCT`. */
  withCreateInBrowse?: boolean;
};

function productLabel(product: Pick<SelectableProduct, "code" | "title">) {
  return `${product.title} - ${product.code}`;
}

export default function SelectProduct({
  value,
  setValue,
  onProductSelect,
  withBrowseModal = false,
  withCreateInBrowse = false,
  searchable = true,
  clearable = true,
  ...props
}: SelectProductProps) {
  const { translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { value: searchKeyword, debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");
  const [selectedProduct, setSelectedProduct] = useState<SelectableProduct | null>(null);
  const [browseOpened, { open: openBrowse, close: closeBrowse }] = useDisclosure(false);
  const [browseKeyword, setBrowseKeyword] = useState("");
  const browseKeywordRef = useRef("");
  const preserveSelectSearchRef = useRef(false);
  const selectWrapRef = useRef<HTMLDivElement>(null);

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
    setSearch("");

    if (!next) {
      setSelectedProduct(null);
      onProductSelect?.(null);
      return;
    }

    const product = products.find((item) => item.code === next) || (selectedProduct?.code === next ? selectedProduct : null);
    if (product) {
      setSelectedProduct(product);
      onProductSelect?.(product);
    }
    // Do not call onProductSelect(null) when the product object is not in the current
    // search results; the parent may resolve metadata from the selected code separately.
  }

  function getSelectedLabel() {
    if (selectedProduct && selectedProduct.code === value) {
      return productLabel(selectedProduct);
    }

    return data.find((option) => option.value === value)?.label;
  }

  function captureBrowseKeyword() {
    const selectedLabel = getSelectedLabel();
    const inputValue = selectWrapRef.current?.querySelector("input")?.value.trim() ?? "";
    const typed = searchKeyword.trim();
    const fromInput = inputValue && inputValue !== selectedLabel ? inputValue : "";
    const fromState = typed && typed !== selectedLabel ? typed : "";

    browseKeywordRef.current = fromInput || fromState;
  }

  function handleOpenBrowse() {
    preserveSelectSearchRef.current = true;
    setBrowseKeyword(browseKeywordRef.current);
    openBrowse();
  }

  function handleCloseBrowse() {
    preserveSelectSearchRef.current = false;
    closeBrowse();
  }

  function handleBrowseSelect(product: ProductWithDimensions) {
    setSelectedProduct(product);
    setValue(product.code);
    setSearch("");
    onProductSelect?.(product);
    handleCloseBrowse();
  }

  // Mantine syncs the search input to the selected option label after change,
  // and clears it on blur (e.g. when the browse modal takes focus).
  function handleSearchChange(search: string) {
    const selectedLabel = getSelectedLabel();

    if (selectedLabel && search === selectedLabel) return;
    if (!search && preserveSelectSearchRef.current) return;

    setSearch(search);
  }

  const select = (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable}
      clearable={clearable}
      onSearchChange={handleSearchChange}
      disabled={props.disabled}
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

  if (!withBrowseModal) return select;

  return (
    <div className="w-full min-w-0 self-start">
      <div className="flex w-full min-w-0 items-end gap-2">
        <div ref={selectWrapRef} className="min-w-0 flex-1">
          {select}
        </div>
        <Tooltip label={translate("Browse products", "تصفح المنتجات")} withArrow>
          <ActionIcon
            size={36}
            variant="light"
            className="shrink-0"
            onMouseDown={(event) => {
              event.preventDefault();
              preserveSelectSearchRef.current = true;
              captureBrowseKeyword();
            }}
            onClick={handleOpenBrowse}
            disabled={props.disabled}
          >
            <Table2 size={15} />
          </ActionIcon>
        </Tooltip>
      </div>

      <BrowseProductsModal
        opened={browseOpened}
        close={handleCloseBrowse}
        onSelect={handleBrowseSelect}
        initialKeyword={browseKeyword}
        withCreate={withCreateInBrowse}
      />
    </div>
  );
}
