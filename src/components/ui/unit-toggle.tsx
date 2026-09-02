"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { ArrowLeftRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialUnit } from "@/lib/constants/enums/material-units";
import type { MaterialUnitConversionSummary } from "@/types/material";

type UnitOption = { unit: MaterialUnit; factor: number };

type UnitToggleProps = {
  baseUnit: MaterialUnit;
  unitConversions: MaterialUnitConversionSummary[];
  defaultUnit?: MaterialUnit;
  children: (props: { unit: MaterialUnit; factor: number; toggleButton: ReactNode }) => ReactNode;
};

export default function UnitToggle({ baseUnit, unitConversions, defaultUnit, children }: UnitToggleProps) {
  const { translate } = useI18n();

  const options = useMemo<UnitOption[]>(() => {
    const alts = unitConversions
      .filter((row) => row.unit !== baseUnit)
      .map((row) => ({ unit: row.unit, factor: Number(row.conversionFactorToBase) }));

    return [{ unit: baseUnit, factor: 1 }, ...alts];
  }, [baseUnit, unitConversions]);

  const defaultIndex = useMemo(() => {
    const preferredUnit = defaultUnit ?? baseUnit;
    const index = options.findIndex((option) => option.unit === preferredUnit);
    return index >= 0 ? index : 0;
  }, [defaultUnit, baseUnit, options]);

  const [index, setIndex] = useState(defaultIndex);

  const current = options[index % options.length];
  const canToggle = options.length > 1;

  const toggleButton = canToggle ? (
    <Tooltip withArrow label={translate("Switch unit", "تبديل الوحدة")}>
      <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => setIndex((prev) => (prev + 1) % options.length)}>
        <ArrowLeftRight size={12} />
      </ActionIcon>
    </Tooltip>
  ) : null;

  return children({ unit: current.unit, factor: current.factor, toggleButton });
}
