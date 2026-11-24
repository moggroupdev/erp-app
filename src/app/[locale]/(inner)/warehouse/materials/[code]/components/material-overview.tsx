"use client";

import type { ReactNode } from "react";
import { Badge, Skeleton } from "@mantine/core";
import { PackageSearch } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import UnitToggle from "@/components/ui/unit-toggle";
import { CreatorLink, EmptyValue } from "@/components/ui/entity-details";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import { getStockStatusLabel, STOCK_STATUSES, type StockStatus } from "@/lib/constants/enums/derived/stock-statuses";
import { getSemanticStatusColors, type SemanticStatus } from "@/lib/constants/status-colors";
import { formatDate, formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { formatBaseQuantityForDisplay } from "@/lib/helpers/format-quantity";
import { toDisplayUnitPrice } from "@/lib/helpers/unit-conversion";
import { useI18n } from "@/lib/i18n/hooks";
import type { MaterialLastPurchasePrice, MaterialWithCreatorAndUnitConversions } from "@/types/material";

function deriveStockStatus(quantity: number, minimumStock: number | null): StockStatus {
  if (quantity <= 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (minimumStock != null && quantity <= minimumStock) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
}

function stockStatusToSemantic(status: StockStatus): SemanticStatus {
  if (status === STOCK_STATUSES.OUT_OF_STOCK) return "danger";
  if (status === STOCK_STATUSES.LOW_STOCK) return "warning";
  return "success";
}

function stockBarFillClass(status: StockStatus): string {
  if (status === STOCK_STATUSES.OUT_OF_STOCK) return "bg-clay-600";
  if (status === STOCK_STATUSES.LOW_STOCK) return "bg-ochre-600";
  return "bg-teal-600";
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-600">
      <span className="shrink-0 text-xs text-gray-400">{label}</span>
      <div className="min-w-0 font-medium text-gray-800">{children}</div>
    </div>
  );
}

function formatMoneyWithUnit(amount: number, currency: string | undefined, unitLabel: string) {
  return `${formatMoney(amount, currency)} / ${unitLabel}`;
}

function PriceTile({ label, value, meta }: { label: string; value: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex h-full min-h-30 flex-col gap-1.5 rounded-lg bg-gray-50/70 p-4">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="text-base font-semibold text-gray-900 tabular-nums">{value}</div>
      <div className="mt-auto flex min-h-8 flex-col gap-1.5 text-xs text-gray-500">{meta ?? null}</div>
    </div>
  );
}

export default function MaterialOverview({
  material,
  lastPurchasePrice,
  lastPurchasePriceLoading = false,
}: {
  material: MaterialWithCreatorAndUnitConversions;
  /** `undefined` when the user lacks permission; `null` while loading or on empty snapshot. */
  lastPurchasePrice?: MaterialLastPurchasePrice | null;
  lastPurchasePriceLoading?: boolean;
}) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useMaterialCategories();

  const isDeleted = !!material.deletedAt;
  const subCategory = helpers.getMaterialCategorySubById(material.subCategoryId);
  const mainCategory = subCategory ? helpers.getMaterialCategoryMainById(subCategory.mainCategoryId) : null;
  const categoryPath =
    mainCategory && subCategory
      ? `${mainCategory.title} / ${subCategory.title}`
      : subCategory?.title || mainCategory?.title || null;

  const stockStatus = deriveStockStatus(Number(material.quantity), material.minimumStock);
  const stockColors = getSemanticStatusColors(stockStatusToSemantic(stockStatus));
  const deletedColors = getSemanticStatusColors("danger");
  const typeLabel = getMaterialTypeLabel(material.materialType, locale);
  const baseUnitLabel = getMaterialUnitLabel(material.unitOfMeasurement, locale);
  const hasLastPurchaseAccess = lastPurchasePrice !== undefined;
  const hasLastPurchase = lastPurchasePrice != null && lastPurchasePrice.unitPrice != null;
  const hasMinimumStock = material.minimumStock != null && Number(material.minimumStock) > 0;

  return (
    <section className="flex flex-col gap-3">
      <UnitToggle baseUnit={material.unitOfMeasurement} unitConversions={material.unitConversions}>
        {({ unit, factor, toggleButton }) => {
          const displayUnitLabel = getMaterialUnitLabel(unit, locale);
          const displayQuantity = formatBaseQuantityForDisplay(Number(material.quantity), factor);
          const displayMinStock =
            material.minimumStock != null ? formatBaseQuantityForDisplay(Number(material.minimumStock), factor) : null;
          const thresholdPct = hasMinimumStock
            ? Math.min(100, (Number(material.quantity) / Number(material.minimumStock)) * 100)
            : 0;

          return (
            <>
              {/* Zone 1: Identity */}
              <header className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isDeleted ? "bg-clay-50 text-clay-600" : "bg-haze-50 text-haze-600"
                      }`}
                    >
                      <PackageSearch size={20} strokeWidth={1.75} />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{material.title}</h2>
                          <Badge size="sm" variant="light" color="plum" radius="md">
                            {typeLabel}
                          </Badge>
                          {isDeleted ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${deletedColors.surfaceClass} ${deletedColors.textClass}`}
                            >
                              {translate("Deleted", "محذوف")}
                            </span>
                          ) : null}
                        </div>

                        <div className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                          <span className="text-gray-500">{translate("Selected unit", "وحدة القياس المحددة")}</span>
                          <span className="text-gray-300">·</span>
                          <span>{displayUnitLabel}</span>
                          {toggleButton}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <MetaItem label={translate("Code", "الكود")}>
                          <span className="inline-flex items-center gap-1 font-mono">
                            {material.code}
                            <CopyButton text={material.code} />
                          </span>
                        </MetaItem>

                        {material.legacyCode ? (
                          <MetaItem label={translate("Legacy", "السابق")}>
                            <span className="inline-flex items-center gap-1 font-mono">
                              {material.legacyCode}
                              <CopyButton text={material.legacyCode} />
                            </span>
                          </MetaItem>
                        ) : null}

                        {categoryPath ? (
                          <MetaItem label={translate("Category", "الفئة")}>
                            <span className="truncate">{categoryPath}</span>
                          </MetaItem>
                        ) : null}

                        <MetaItem label={translate("Base unit", "الوحدة الأساسية")}>
                          <span>{baseUnitLabel}</span>
                        </MetaItem>
                      </div>
                    </div>
                  </div>

                  {material.description ? (
                    <p className="border-t border-gray-100 pt-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
                      {material.description}
                    </p>
                  ) : null}
                </div>
              </header>

              {/* Zone 2: Stock + Pricing */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200/75 bg-gray-50/70 p-4 lg:col-span-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      {translate("Stock", "المخزون")}
                    </span>
                    {!isDeleted ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stockColors.surfaceClass} ${stockColors.textClass}`}
                      >
                        {getStockStatusLabel(stockStatus, locale)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                      {displayQuantity} / {displayUnitLabel}
                    </span>
                    <span className="text-xs text-gray-500">{translate("On hand", "الرصيد الحالي")}</span>
                  </div>

                  {hasMinimumStock ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                        <span>{translate("Minimum stock", "الحد الأدنى")}</span>
                        <span className="font-medium text-gray-700 tabular-nums">
                          {displayMinStock} / {displayUnitLabel}
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-gray-200"
                        role="progressbar"
                        aria-valuenow={Math.round(thresholdPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={translate("Stock relative to minimum", "المخزون نسبةً للحد الأدنى")}
                      >
                        <div
                          className={`h-full rounded-full ${stockBarFillClass(stockStatus)}`}
                          style={{ width: `${thresholdPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      {translate("No minimum stock set", "لم يُحدد حد أدنى للمخزون")}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-4 lg:col-span-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      {translate("Pricing", "التسعير")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {translate(
                        "All prices are for the selected unit of measurement.",
                        "جميع الأسعار لوحدة القياس المحددة.",
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <PriceTile
                      label={translate("Average Price", "السعر المتوسط")}
                      value={formatMoneyWithUnit(
                        toDisplayUnitPrice(Number(material.unitPrice), factor),
                        translation.currency,
                        displayUnitLabel,
                      )}
                    />

                    {hasLastPurchaseAccess ? (
                      <PriceTile
                        label={translate("Last Purchase Price", "آخر سعر شراء")}
                        value={
                          lastPurchasePriceLoading ? (
                            <Skeleton height={22} width={120} radius="sm" />
                          ) : hasLastPurchase ? (
                            formatMoneyWithUnit(
                              toDisplayUnitPrice(Number(lastPurchasePrice!.unitPrice), factor),
                              translation.currency,
                              displayUnitLabel,
                            )
                          ) : (
                            <EmptyValue />
                          )
                        }
                        meta={
                          lastPurchasePriceLoading ? (
                            <Skeleton height={12} width="70%" radius="sm" />
                          ) : hasLastPurchase ? (
                            <>
                              {lastPurchasePrice!.supplierName ? <span>{lastPurchasePrice!.supplierName}</span> : null}
                              {lastPurchasePrice!.purchasedAt ? (
                                <span>{formatDate(lastPurchasePrice!.purchasedAt, locale)}</span>
                              ) : null}
                            </>
                          ) : (
                            <span>{translate("Never purchased", "لم يُشترَ من قبل")}</span>
                          )
                        }
                      />
                    ) : null}

                    {material.marketUnitPrice != null ? (
                      <PriceTile
                        label={translate("Market Price", "سعر السوق")}
                        value={formatMoneyWithUnit(
                          toDisplayUnitPrice(Number(material.marketUnitPrice), factor),
                          translation.currency,
                          displayUnitLabel,
                        )}
                        meta={
                          <>
                            {material.marketUnitPriceSetBy ? (
                              <span className="inline-flex flex-wrap items-center gap-1">
                                <span>{translate("Set by", "بواسطة")}</span>
                                <CreatorLink creator={material.marketUnitPriceSetBy} />
                              </span>
                            ) : null}
                            {material.marketUnitPriceSetAt ? (
                              <span>{formatDateAndTime(material.marketUnitPriceSetAt, locale)}</span>
                            ) : null}
                          </>
                        }
                      />
                    ) : null}

                    {material.marketManufacturingCost != null ? (
                      <PriceTile
                        label={translate("Market Manufacturing Cost", "تكلفة التصنيع السوقية")}
                        value={formatMoneyWithUnit(
                          toDisplayUnitPrice(Number(material.marketManufacturingCost), factor),
                          translation.currency,
                          displayUnitLabel,
                        )}
                        meta={
                          <>
                            {material.marketManufacturingCostSetBy ? (
                              <span className="inline-flex flex-wrap items-center gap-1">
                                <span>{translate("Set by", "بواسطة")}</span>
                                <CreatorLink creator={material.marketManufacturingCostSetBy} />
                              </span>
                            ) : null}
                            {material.marketManufacturingCostSetAt ? (
                              <span>{formatDateAndTime(material.marketManufacturingCostSetAt, locale)}</span>
                            ) : null}
                          </>
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </UnitToggle>

      {/* Zone 3: Audit footer */}
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gray-200/80 bg-gray-50/50 px-4 py-3 text-sm">
        <MetaItem label={translate("Created by", "أنشئ بواسطة")}>
          <CreatorLink creator={material.createdBy} />
        </MetaItem>
        <MetaItem label={translate("Registered", "تاريخ التسجيل")}>
          <span>{formatDateAndTime(material.createdAt, locale)}</span>
        </MetaItem>
        {isDeleted ? (
          <>
            {material.deletedBy ? (
              <MetaItem label={translate("Deleted by", "حُذف بواسطة")}>
                <CreatorLink creator={material.deletedBy} />
              </MetaItem>
            ) : null}
            <MetaItem label={translate("Deleted", "تاريخ الحذف")}>
              <span className="text-clay-600">{formatDateAndTime(material.deletedAt!, locale)}</span>
            </MetaItem>
          </>
        ) : null}
      </footer>
    </section>
  );
}
