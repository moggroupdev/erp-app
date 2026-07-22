"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Material } from "@/types/material";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";

export type SelectMaterialProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onMaterialSelect?: (material: Material | null) => void;
  /** Material codes to hide from the options list (e.g. already on the BOM). */
  excludeCodes?: string[];
};

export default function SelectMaterial({
  value,
  setValue,
  onMaterialSelect,
  excludeCodes = [],
  searchable = true,
  clearable = true,
  ...props
}: SelectMaterialProps) {
  const { translate } = useI18n();
  const privateRequest = usePrivateRequest();

  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const listParams = removeEmptyParams({
    page: "1",
    limit: "20",
    keyword: debouncedSearch,
  });

  const materialsQuery = useQuery({
    queryKey: queryKeys.materials.list(listParams),
    queryFn: ({ signal }) => materialsApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.materials,
  });

  const materials = materialsQuery.data?.data ?? [];

  // Keep the currently selected material available for the label even when search results change
  useEffect(() => {
    if (!value) {
      setSelectedMaterial(null);
      return;
    }

    const fromResults = materials.find((material) => material.code === value);
    if (fromResults) {
      setSelectedMaterial(fromResults);
      return;
    }

    if (selectedMaterial?.code === value) return;

    let cancelled = false;
    materialsApi
      .get({ privateRequest, code: value })
      .then((material) => {
        if (!cancelled) setSelectedMaterial(material);
      })
      .catch(() => {
        if (!cancelled) setSelectedMaterial(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, materials]);

  const excludeSet = useMemo(() => new Set(excludeCodes.filter((code) => code !== value)), [excludeCodes, value]);

  const data = useMemo(() => {
    const byCode = new Map<string, Material>();

    for (const material of materials) {
      if (!excludeSet.has(material.code)) byCode.set(material.code, material);
    }

    if (selectedMaterial && !excludeSet.has(selectedMaterial.code)) {
      byCode.set(selectedMaterial.code, selectedMaterial);
    }

    return Array.from(byCode.values()).map((material) => ({
      value: material.code,
      label: `${material.title} (${material.code})`,
    }));
  }, [materials, selectedMaterial, excludeSet]);

  function handleChange(next: string | null) {
    setValue(next);

    if (!next) {
      setSelectedMaterial(null);
      onMaterialSelect?.(null);
      return;
    }

    const material =
      materials.find((item) => item.code === next) || (selectedMaterial?.code === next ? selectedMaterial : null);

    if (material) {
      setSelectedMaterial(material);
      onMaterialSelect?.(material);
    } else {
      onMaterialSelect?.(null);
    }
  }

  return (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable}
      clearable={clearable}
      onSearchChange={setSearch}
      filter={({ options }) => options}
      nothingFoundMessage={
        materialsQuery.isFetching
          ? translate("Searching...", "جاري البحث...")
          : translate("No materials found", "لا توجد مواد")
      }
      disabled={props.disabled || (materialsQuery.isFetching && data.length === 0)}
    />
  );
}
