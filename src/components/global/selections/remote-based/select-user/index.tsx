"use client";

/**
 * Unlike other query-based selectors,
 * SelectUser searches a live entity list via usersApi.
 */

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import usersApi from "@/lib/api/users";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { User } from "@/types/user";
import { UserRound } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";

type SelectableUser = Pick<User, "id" | "name"> & Partial<Pick<User, "code">>;

export type SelectUserProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onUserSelect?: (user: SelectableUser | null) => void;
  /** User ids to hide from the options list. */
  excludeIds?: string[];
  /**
   * Search non-admin users via `GET /users/lookup` (`lookup_users`).
   * Defaults to the full users list (`read_users`).
   */
  lookup?: boolean;
  /** Seed the selected option label without fetching `GET /users/:id` (used with `lookup`). */
  initialUser?: SelectableUser | null;
};

export default function SelectUser({
  value,
  setValue,
  onUserSelect,
  excludeIds = [],
  lookup = false,
  initialUser = null,
  searchable = true,
  clearable = true,
  ...props
}: SelectUserProps) {
  const { translate } = useI18n();

  const privateRequest = usePrivateRequest();

  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const [selectedUser, setSelectedUser] = useState<SelectableUser | null>(
    initialUser && initialUser.id === value ? initialUser : null,
  );

  const trimmedSearch = debouncedSearch.trim();
  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: trimmedSearch });

  const usersQuery = useQuery({
    queryKey: lookup ? queryKeys.users.lookup(listParams) : queryKeys.users.list(listParams),
    queryFn: ({ signal }) =>
      lookup
        ? usersApi.lookup({ privateRequest, params: listParams, signal })
        : usersApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.users,
    placeholderData: keepPreviousData,
    enabled: trimmedSearch.length > 0,
  });

  const users = trimmedSearch.length > 0 ? (usersQuery.data?.data ?? []) : [];

  // Keep the currently selected user available for the label even when search results change
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      return;
    }

    const fromResults = users.find((user) => user.id === value);

    if (fromResults) {
      setSelectedUser(fromResults);
      return;
    }

    if (selectedUser?.id === value) return;

    if (initialUser?.id === value) {
      setSelectedUser(initialUser);
      return;
    }

    // `GET /users/:id` requires `read_users`; skip it when looking up users.
    if (lookup) return;

    let cancelled = false;

    usersApi
      .get({ privateRequest, id: value })
      .then((user) => {
        if (!cancelled) setSelectedUser(user);
      })
      .catch(() => {
        if (!cancelled) setSelectedUser(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, users, initialUser, lookup]);

  const excludeSet = useMemo(() => new Set(excludeIds.filter((id) => id !== value)), [excludeIds, value]);

  const data = useMemo(() => {
    const byId = new Map<string, SelectableUser>();

    for (const user of users) if (!excludeSet.has(user.id)) byId.set(user.id, user);

    if (selectedUser && !excludeSet.has(selectedUser.id)) byId.set(selectedUser.id, selectedUser);

    return Array.from(byId.values()).map((user) => ({
      value: user.id,
      label: user.code ? `${user.name} - ${user.code}` : user.name,
    }));
  }, [users, selectedUser, excludeSet]);

  function handleChange(next: string | null) {
    setValue(next);

    if (!next) {
      setSelectedUser(null);
      onUserSelect?.(null);
      return;
    }

    const user = users.find((item) => item.id === next) || (selectedUser?.id === next ? selectedUser : null);

    if (user) {
      setSelectedUser(user);
      onUserSelect?.(user);
    } else onUserSelect?.(null);
  }

  // Mantine syncs the search input to the selected option label after change.
  // Ignore that so we do not fire another users list request.
  function handleSearchChange(search: string) {
    const selectedLabel =
      selectedUser && selectedUser.id === value
        ? selectedUser.code
          ? `${selectedUser.name} - ${selectedUser.code}`
          : selectedUser.name
        : data.find((option) => option.value === value)?.label;

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
      disabled={props.disabled}
      rightIcon={<UserRound size={15} className="pointer-events-none text-gray-400" />}
      // Server already filters by keyword (name, code, email, phone); skip client-side label matching.
      filter={({ options }) => options}
      renderOption={({ option }) => {
        const user = users.find((item) => item.id === option.value) || (selectedUser?.id === option.value ? selectedUser : null);
        const name = user?.name ?? option.label;
        const code = user?.code ?? "";

        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate">{name}</span>
            {code ? <span className="shrink-0 text-xs text-gray-400">{code}</span> : null}
          </div>
        );
      }}
      nothingFoundMessage={
        !trimmedSearch
          ? translate("Type to search users", "اكتب للبحث عن المستخدمين")
          : usersQuery.isFetching
            ? translate("Searching...", "جاري البحث...")
            : translate("No users found", "لا يوجد مستخدمون")
      }
    />
  );
}
