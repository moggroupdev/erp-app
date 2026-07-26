"use client";

/**
 * Unlike other query-based selectors,
 * SelectMaterial searches a live entity list via materialsApi and optionally
 * opens a detail-browse modal (search + category filters + results table).
 */

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { Material } from "@/types/material";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Table2 } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import BrowseMaterialsModal from "./browse-materials-modal";

export type SelectMaterialProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onMaterialSelect?: (material: Material | null) => void;
  /** Material codes to hide from the options list (e.g. already on the BOM). */
  excludeCodes?: string[];
  /** Show a button that opens a detail-browse modal for picking a material. */
  withBrowseModal?: boolean;
};

export default function SelectMaterial({
  value,
  setValue,
  onMaterialSelect,
  excludeCodes = [],
  withBrowseModal = false,
  searchable = true,
  clearable = true,
  ...props
}: SelectMaterialProps) {
  const { translate } = useI18n();

  const privateRequest = usePrivateRequest();

  const { debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [browseOpened, { open: openBrowse, close: closeBrowse }] = useDisclosure(false);

  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: debouncedSearch });

  const materialsQuery = useQuery({
    queryKey: queryKeys.materials.list(listParams),
    queryFn: ({ signal }) => materialsApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.materials,
    placeholderData: keepPreviousData,
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

    for (const material of materials) if (!excludeSet.has(material.code)) byCode.set(material.code, material);

    if (selectedMaterial && !excludeSet.has(selectedMaterial.code)) byCode.set(selectedMaterial.code, selectedMaterial);

    return Array.from(byCode.values()).map((material) => ({
      value: material.code,
      label: `${material.title} - ${material.code}`,
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
    } else onMaterialSelect?.(null);
  }

  function handleBrowseSelect(material: Material) {
    setSelectedMaterial(material);
    setValue(material.code);
    onMaterialSelect?.(material);
    closeBrowse();
  }

  const select = (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable}
      clearable={clearable}
      onSearchChange={setSearch}
      disabled={props.disabled}
      // Server already filters by keyword (title, code, legacyCode); skip client-side label matching.
      filter={({ options }) => options}
      nothingFoundMessage={
        materialsQuery.isFetching
          ? translate("Searching...", "جاري البحث...")
          : translate("No materials found", "لا توجد مواد")
      }
    />
  );

  if (!withBrowseModal) return select;

  return (
    <>
      <div className="flex items-end gap-2">
        <div className="flex-1">{select}</div>
        <Tooltip label={translate("Browse materials", "تصفح المواد")} withArrow>
          <ActionIcon variant="light" color="teal" radius="md" size={36} onClick={openBrowse} disabled={props.disabled}>
            <Table2 size={15} />
          </ActionIcon>
        </Tooltip>
      </div>

      <BrowseMaterialsModal
        opened={browseOpened}
        close={closeBrowse}
        onSelect={handleBrowseSelect}
        excludeCodes={excludeCodes}
      />
    </>
  );
}
