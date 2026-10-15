"use client";

/**
 * Searches customers via customersApi.list (`read_customers`).
 */

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi from "@/lib/api/customers";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Customer } from "@/types/customer";
import { UserRound } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";

type SelectableCustomer = Pick<Customer, "id" | "name" | "code">;

export type SelectCustomerProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onCustomerSelect?: (customer: SelectableCustomer | null) => void;
};

export default function SelectCustomer({
  value,
  setValue,
  onCustomerSelect,
  searchable = true,
  clearable = true,
  ...props
}: SelectCustomerProps) {
  const { translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");
  const [selectedCustomer, setSelectedCustomer] = useState<SelectableCustomer | null>(null);

  const trimmedSearch = debouncedSearch.trim();
  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: trimmedSearch });

  const customersQuery = useQuery({
    queryKey: queryKeys.customers.list(listParams),
    queryFn: ({ signal }) => customersApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.customers,
    placeholderData: keepPreviousData,
    enabled: trimmedSearch.length > 0,
  });

  const customers = trimmedSearch.length > 0 ? (customersQuery.data?.data ?? []) : [];

  useEffect(() => {
    if (!value) {
      setSelectedCustomer(null);
      return;
    }

    const fromResults = customers.find((customer) => customer.id === value);
    if (fromResults) {
      setSelectedCustomer(fromResults);
      return;
    }

    if (selectedCustomer?.id === value) return;

    let cancelled = false;
    customersApi
      .get({ privateRequest, id: value })
      .then((customer) => {
        if (!cancelled) setSelectedCustomer(customer);
      })
      .catch(() => {
        if (!cancelled) setSelectedCustomer(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, customers]);

  const data = useMemo(() => {
    const byId = new Map<string, SelectableCustomer>();
    for (const customer of customers) byId.set(customer.id, customer);
    if (selectedCustomer) byId.set(selectedCustomer.id, selectedCustomer);
    return Array.from(byId.values()).map((customer) => ({
      value: customer.id,
      label: `${customer.name} - ${customer.code}`,
    }));
  }, [customers, selectedCustomer]);

  function handleChange(next: string | null) {
    setValue(next);
    if (!next) {
      setSelectedCustomer(null);
      onCustomerSelect?.(null);
      return;
    }

    const customer = customers.find((item) => item.id === next) || (selectedCustomer?.id === next ? selectedCustomer : null);
    if (customer) {
      setSelectedCustomer(customer);
      onCustomerSelect?.(customer);
    } else onCustomerSelect?.(null);
  }

  function handleSearchChange(search: string) {
    const selectedLabel =
      selectedCustomer && selectedCustomer.id === value ? `${selectedCustomer.name} - ${selectedCustomer.code}` : null;
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
      rightIcon={<UserRound size={15} className="pointer-events-none text-gray-400" />}
      filter={({ options }) => options}
      nothingFoundMessage={
        !trimmedSearch
          ? translate("Type to search customers", "اكتب للبحث عن العملاء")
          : customersQuery.isFetching
            ? translate("Searching...", "جاري البحث...")
            : translate("No customers found", "لا يوجد عملاء")
      }
    />
  );
}
