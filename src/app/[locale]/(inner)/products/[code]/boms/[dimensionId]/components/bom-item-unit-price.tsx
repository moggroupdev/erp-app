"use client";

import { Badge, Menu, Tooltip } from "@mantine/core";
import { Check } from "lucide-react";
import {
  getItemCostingMethodLabel,
  getItemCostingMethodShortLabel,
  ITEM_COSTING_METHOD_LABELS_LIST,
  ITEM_COSTING_METHODS,
  type CostingMethod,
  type ItemCostingMethod,
} from "@/lib/constants/enums/derived/costing-methods";
import { formatDate } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getMaterialCostPrice } from "@/lib/helpers/bom-display";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import type { Locale } from "@/lib/i18n/config";

const ZERO_VALUE_CLASS = "text-orange-500";

type MaterialPriceSource = {
  unitPrice: number;
  lastPurchasePrice: number | null;
  lastPurchaseDate: Date | null;
  marketUnitPrice: number | null;
  marketUnitPriceSetAt: Date | null;
};

type BomItemUnitPriceProps = {
  material: MaterialPriceSource;
  bomCostingMethod: CostingMethod;
  effectiveMethod: ItemCostingMethod;
  displayFactor: number;
  canPickAlternative: boolean;
  onSelectMethod: (method: ItemCostingMethod) => void;
};

export default function BomItemUnitPrice({
  material,
  bomCostingMethod,
  effectiveMethod,
  displayFactor,
  canPickAlternative,
  onSelectMethod,
}: BomItemUnitPriceProps) {
  const { locale, translate } = useI18n();

  const unitCost = getMaterialCostPrice(material, effectiveMethod);
  const displayPrice = formatMoney(toDisplayUnitPrice(unitCost, displayFactor));
  const isZero = unitCost === 0;
  const hasOverride = effectiveMethod !== bomCostingMethod;
  const tooltipLabel = getPriceTooltipLabel(material, effectiveMethod, locale, translate);
  const priceClassName = isZero ? ZERO_VALUE_CLASS : "text-gray-800";

  const badge = hasOverride ? (
    <Badge size="xs" variant="light" color="teal" radius="xl" className="shrink-0 rounded-full normal-case">
      {getItemCostingMethodShortLabel(effectiveMethod, locale)}
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
        <Menu.Label>{translate("Costing method for this item", "أساس التكلفة لهذا البند")}</Menu.Label>
        {ITEM_COSTING_METHOD_LABELS_LIST.map((method) => {
          const methodPrice = getMaterialCostPrice(material, method.value);
          const isSelected = effectiveMethod === method.value;
          const isDisabled = methodPrice === 0 && method.value !== bomCostingMethod;

          return (
            <Menu.Item
              key={method.value}
              disabled={isDisabled}
              leftSection={isSelected ? <Check size={14} /> : <span className="inline-block w-3.5" />}
              rightSection={
                <span className={`text-xs tabular-nums ${methodPrice === 0 ? ZERO_VALUE_CLASS : "text-gray-500"}`}>
                  {formatMoney(toDisplayUnitPrice(methodPrice, displayFactor))}
                </span>
              }
              onClick={() => onSelectMethod(method.value)}
            >
              {getItemCostingMethodLabel(method.value, locale)}
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

function getPriceTooltipLabel(
  material: MaterialPriceSource,
  method: ItemCostingMethod,
  locale: Locale,
  translate: (en: string, ar: string) => string,
): string | null {
  if (method === ITEM_COSTING_METHODS.LAST_PURCHASE_PRICE) {
    if (material.lastPurchaseDate) {
      return translate(
        `Last purchase date: ${formatDate(material.lastPurchaseDate, locale)}`,
        `تاريخ آخر شراء: ${formatDate(material.lastPurchaseDate, locale)}`,
      );
    }
    return translate("No purchase date", "لا يوجد تاريخ شراء");
  }

  if (method === ITEM_COSTING_METHODS.MARKET_PRICE) {
    if (material.marketUnitPriceSetAt) {
      return translate(
        `Market price set at: ${formatDate(material.marketUnitPriceSetAt, locale)}`,
        `تاريخ تعيين سعر السوق: ${formatDate(material.marketUnitPriceSetAt, locale)}`,
      );
    }
    return translate("No market price date", "لا يوجد تاريخ لسعر السوق");
  }

  return null;
}
