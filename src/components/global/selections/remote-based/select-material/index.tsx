"use client";

/**
 * Unlike other query-based selectors,
 * SelectMaterial searches a live entity list via materialsApi and optionally
 * opens a detail-browse modal (search + category filters + results table).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDebouncedState from "@/hooks/use-debounced-state";
import usePrivateRequest from "@/hooks/use-private-request";
import materialsApi from "@/lib/api/materials";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import removeEmptyParams from "@/lib/helpers/remove-empty-params";
import type { MaterialWithUnitConversions, MaterialWithUnitConversionsSelection } from "@/types/material";
import { ActionIcon, Tooltip } from "@mantine/core";
import { PackageSearch, Table2 } from "lucide-react";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import BrowseMaterialsModal from "./browse-materials-modal";

export type SelectMaterialProps = Omit<GenericDataSelectProps, "data" | "value" | "setValue" | "onChange" | "rightIcon"> & {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
  onMaterialSelect?: (material: MaterialWithUnitConversionsSelection | null) => void;
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

  const { value: searchKeyword, debouncedValue: debouncedSearch, setPendingValue: setSearch } = useDebouncedState("");

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithUnitConversionsSelection | null>(null);
  const [browseOpened, { open: openBrowse, close: closeBrowse }] = useDisclosure(false);
  const [browseKeyword, setBrowseKeyword] = useState("");
  const browseKeywordRef = useRef("");
  const preserveSelectSearchRef = useRef(false);
  const selectWrapRef = useRef<HTMLDivElement>(null);

  const trimmedSearch = debouncedSearch.trim();
  const listParams = removeEmptyParams({ page: "1", limit: "20", keyword: trimmedSearch });

  const materialsQuery = useQuery({
    queryKey: queryKeys.materials.list(listParams),
    queryFn: ({ signal }) => materialsApi.list({ privateRequest, params: listParams, signal }),
    staleTime: staleTimes.materials,
    placeholderData: keepPreviousData,
    enabled: trimmedSearch.length > 0,
  });

  const materials = trimmedSearch.length > 0 ? (materialsQuery.data?.data ?? []) : [];

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
    const byCode = new Map<string, MaterialWithUnitConversionsSelection>();

    for (const material of materials) if (!excludeSet.has(material.code)) byCode.set(material.code, material);

    if (selectedMaterial && !excludeSet.has(selectedMaterial.code)) byCode.set(selectedMaterial.code, selectedMaterial);

    return Array.from(byCode.values()).map((material) => ({
      value: material.code,
      label: `${material.title} - ${material.code}`,
    }));
  }, [materials, selectedMaterial, excludeSet]);

  function handleChange(next: string | null) {
    setValue(next);
    setSearch("");

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
    }
    // Do not call onMaterialSelect(null) when the material object is not in the current
    // search results; the parent may resolve metadata from the selected code separately.
  }

  function getSelectedLabel() {
    if (selectedMaterial && selectedMaterial.code === value) {
      return selectedMaterial.title;
    }

    const material = materials.find((item) => item.code === value);
    if (material) return material.title;

    const optionLabel = data.find((option) => option.value === value)?.label;
    if (!optionLabel) return undefined;

    const separatorIndex = optionLabel.lastIndexOf(" - ");
    return separatorIndex >= 0 ? optionLabel.slice(0, separatorIndex) : optionLabel;
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

  function handleBrowseSelect(material: MaterialWithUnitConversions) {
    setSelectedMaterial(material);
    setValue(material.code);
    setSearch("");
    onMaterialSelect?.(material);
    handleCloseBrowse();
  }

  // Mantine syncs the search input to the selected option label after change,
  // and clears it on blur (e.g. when the browse modal takes focus).
  function handleSearchChange(search: string) {
    if (value) return;

    const selectedLabel = getSelectedLabel();

    if (selectedLabel && search === selectedLabel) return;
    if (!search && preserveSelectSearchRef.current) return;

    setSearch(search);
  }

  const hasSelection = Boolean(value);

  const select = (
    <DataSelect
      {...props}
      value={value}
      setValue={handleChange as React.Dispatch<React.SetStateAction<string | null>>}
      data={data}
      searchable={searchable && !hasSelection}
      clearable={clearable}
      readOnly={hasSelection || props.readOnly}
      dropdownOpened={hasSelection ? false : undefined}
      searchValue={hasSelection ? getSelectedLabel() || "" : searchKeyword}
      onSearchChange={handleSearchChange}
      disabled={props.disabled}
      classNames={hasSelection ? { input: "!cursor-default" } : props.classNames}
      rightIcon={<PackageSearch size={15} className="pointer-events-none text-gray-400" />}
      // Server already filters by keyword (title, code, legacyCode); skip client-side label matching.
      filter={({ options }) => options}
      renderOption={({ option }) => {
        const material =
          materials.find((item) => item.code === option.value) ||
          (selectedMaterial?.code === option.value ? selectedMaterial : null);
        const title = material?.title ?? option.label;
        const code = material?.code ?? option.value;

        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <span className="min-w-0 truncate">{title}</span>
            <span className="shrink-0 text-xs text-gray-400">{code}</span>
          </div>
        );
      }}
      nothingFoundMessage={
        !trimmedSearch
          ? translate("Type to search materials", "اكتب للبحث عن المواد")
          : materialsQuery.isFetching
            ? translate("Searching...", "جاري البحث...")
            : translate("No materials found", "لا توجد مواد")
      }
    />
  );

  if (!withBrowseModal) return select;

  return (
    <>
      <div className="flex items-end gap-2">
        <div ref={selectWrapRef} className="flex-1">
          {select}
        </div>
        <Tooltip label={translate("Browse materials", "تصفح المواد")} withArrow>
          <ActionIcon
            variant="light"
            color="teal"
            radius="md"
            size={36}
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

      <BrowseMaterialsModal
        opened={browseOpened}
        close={handleCloseBrowse}
        onSelect={handleBrowseSelect}
        excludeCodes={excludeCodes}
        initialKeyword={browseKeyword}
      />
    </>
  );
}
