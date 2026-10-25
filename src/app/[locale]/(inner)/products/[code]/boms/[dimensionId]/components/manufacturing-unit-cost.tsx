"use client";

import { Badge, Menu, Tooltip } from "@mantine/core";
import { Check } from "lucide-react";
import {
  getManufacturingCostingMethodLabel,
  getManufacturingCostingMethodShortLabel,
  MANUFACTURING_COSTING_METHOD_LABELS_LIST,
  MANUFACTURING_COSTING_METHODS,
  type ManufacturingCostingMethod,
} from "@/lib/constants/enums/derived/manufacturing-costing-methods";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getManufacturingUnitCost, type ManufacturingCostRow } from "@/lib/helpers/bom-display";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/config";

const ZERO_VALUE_CLASS = "text-ochre-600";
const DEFAULT_METHOD = MANUFACTURING_COSTING_METHODS.LAST_OUTSOURCING_COST;

type ManufacturingUnitCostProps = {
  row: ManufacturingCostRow;
  effectiveMethod: ManufacturingCostingMethod;
  canPickAlternative: boolean;
  onSelectMethod: (method: ManufacturingCostingMethod) => void;
};

export default function ManufacturingUnitCost({
  row,
  effectiveMethod,
  canPickAlternative,
  onSelectMethod,
}: ManufacturingUnitCostProps) {
  const { locale, translate } = useI18n();

  const unitCost = getManufacturingUnitCost(row, effectiveMethod);
  const displayPrice = formatMoney(unitCost);
  const isZero = unitCost === 0;
  const hasOverride = effectiveMethod !== DEFAULT_METHOD;
  const tooltipLabel = getManufacturingCostTooltipLabel(row, effectiveMethod, locale, translate);
  const priceClassName = isZero ? ZERO_VALUE_CLASS : "text-gray-800";

  const badge = hasOverride ? (
    <Badge size="xs" variant="light" color="teal" radius="xl" className="shrink-0 rounded-full normal-case">
      {getManufacturingCostingMethodShortLabel(effectiveMethod, locale)}
    </Badge>
  ) : null;

  const menu = canPickAlternative ? (
    <Menu withinPortal position="bottom-start" offset={4}>
      <Menu.Target>
        <button type="button" className={`cursor-pointer rounded px-0.5 text-start hover:underline ${priceClassName}`}>
          {displayPrice}
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{translate("Manufacturing cost for this item", "تكلفة التصنيع لهذا البند")}</Menu.Label>
        {MANUFACTURING_COSTING_METHOD_LABELS_LIST.map((method) => {
          const methodCost = getManufacturingUnitCost(row, method.value);
          const isSelected = effectiveMethod === method.value;
          const isDisabled = methodCost === 0 && method.value !== DEFAULT_METHOD;

          return (
            <Menu.Item
              key={method.value}
              disabled={isDisabled}
              leftSection={isSelected ? <Check size={14} /> : <span className="inline-block w-3.5" />}
              rightSection={
                <span className={`text-xs tabular-nums ${methodCost === 0 ? ZERO_VALUE_CLASS : "text-gray-500"}`}>
                  {formatMoney(methodCost)}
                </span>
              }
              onClick={() => onSelectMethod(method.value)}
            >
              {getManufacturingCostingMethodLabel(method.value, locale)}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  ) : (
    <span className={priceClassName}>{displayPrice}</span>
  );

  const priceWithOptionalTooltip = tooltipLabel ? (
    <Tooltip withArrow label={tooltipLabel} multiline maw={260}>
      <span className="inline-flex">{menu}</span>
    </Tooltip>
  ) : (
    menu
  );

  return (
    <span className="inline-flex items-center gap-1.5">
      {priceWithOptionalTooltip}
      {badge}
    </span>
  );
}

function getManufacturingCostTooltipLabel(
  row: ManufacturingCostRow,
  method: ManufacturingCostingMethod,
  locale: Locale,
  translate: (en: string, ar: string) => string,
): string | null {
  if (method === MANUFACTURING_COSTING_METHODS.LAST_OUTSOURCING_COST) {
    if (row.lastOutsourcingDate) {
      return translate(
        `Last outsourcing date: ${formatDate(row.lastOutsourcingDate, locale)}`,
        `تاريخ آخر تصنيع خارجي: ${formatDate(row.lastOutsourcingDate, locale)}`,
      );
    }
    return translate("No outsourcing date", "لا يوجد تاريخ تصنيع خارجي");
  }

  if (method === MANUFACTURING_COSTING_METHODS.MARKET_MANUFACTURING_COST) {
    if (row.marketManufacturingCostSetAt) {
      return translate(
        `Market manufacturing cost set at: ${formatDate(row.marketManufacturingCostSetAt, locale)}`,
        `تاريخ تعيين تكلفة التصنيع السوقية: ${formatDate(row.marketManufacturingCostSetAt, locale)}`,
      );
    }
    return translate("No market manufacturing cost date", "لا يوجد تاريخ لتكلفة التصنيع السوقية");
  }

  return null;
}
