import type { Locale } from "@/lib/i18n/config";
import { getMaterialTypeLabel, isValidMaterialType } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel, isValidMaterialUnit } from "@/lib/constants/enums/material-units";
import { formatMoney } from "@/lib/helpers/format-money";
import type { MaterialChangeHistoryChange, MaterialChangeHistorySource } from "@/types/audit-log";

const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  title: { en: "Title", ar: "العنوان" },
  legacyCode: { en: "Legacy code", ar: "الكود السابق" },
  description: { en: "Description", ar: "الوصف" },
  subCategoryId: { en: "Subcategory", ar: "الفئة الفرعية" },
  materialType: { en: "Material type", ar: "نوع المادة" },
  unitOfMeasurement: { en: "Unit of measurement", ar: "وحدة القياس" },
  openingUnitPrice: { en: "Opening unit price", ar: "سعر الوحدة الافتتاحي" },
  openingQuantity: { en: "Opening quantity", ar: "الكمية الافتتاحية" },
  minimumStock: { en: "Minimum stock", ar: "الحد الأدنى للمخزون" },
  marketUnitPrice: { en: "Market price", ar: "سعر السوق" },
  marketManufacturingCost: { en: "Market manufacturing cost", ar: "تكلفة التصنيع السوقية" },
  deletedAt: { en: "Archive status", ar: "حالة الأرشفة" },
  unit: { en: "Unit", ar: "الوحدة" },
  conversionFactorToBase: { en: "Conversion factor", ar: "معامل التحويل" },
  materialCode: { en: "Component material", ar: "المادة المكوّنة" },
  quantityRequired: { en: "Quantity required", ar: "الكمية المطلوبة" },
  unitOfMeasurementSelected: { en: "Selected unit", ar: "الوحدة المختارة" },
  notes: { en: "Notes", ar: "ملاحظات" },
};

const MONEY_FIELDS = new Set(["openingUnitPrice", "marketUnitPrice", "marketManufacturingCost"]);
const UNIT_FIELDS = new Set(["unitOfMeasurement", "unit", "unitOfMeasurementSelected"]);

export function getMaterialChangeFieldLabel(field: string, locale: Locale): string {
  const labels = FIELD_LABELS[field];
  if (!labels) return field;
  return locale === "ar" ? labels.ar : labels.en;
}

export function formatMaterialChangeValue({
  field,
  value,
  locale,
  currency,
  resolveSubCategoryTitle,
}: {
  field: string;
  value: unknown;
  locale: Locale;
  currency: string;
  resolveSubCategoryTitle?: (id: string) => string | null | undefined;
}): string {
  if (value === null || value === undefined || value === "") {
    return locale === "ar" ? "فارغ" : "empty";
  }

  if (field === "deletedAt") {
    return locale === "ar" ? "مؤرشف" : "Archived";
  }

  if (field === "subCategoryId" && typeof value === "string") {
    return resolveSubCategoryTitle?.(value) || value;
  }

  if (field === "materialType" && typeof value === "string" && isValidMaterialType(value)) {
    return getMaterialTypeLabel(value, locale);
  }

  if (UNIT_FIELDS.has(field) && typeof value === "string" && isValidMaterialUnit(value)) {
    return getMaterialUnitLabel(value, locale);
  }

  if (MONEY_FIELDS.has(field)) {
    const amount = Number(value);
    if (!Number.isNaN(amount)) return formatMoney(amount, currency);
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatMaterialChangeLine({
  change,
  locale,
  currency,
  translate,
  resolveSubCategoryTitle,
}: {
  change: MaterialChangeHistoryChange;
  locale: Locale;
  currency: string;
  translate: (en: string, ar: string) => string;
  resolveSubCategoryTitle?: (id: string) => string | null | undefined;
}): string {
  const label = getMaterialChangeFieldLabel(change.field, locale);
  const hasOld = change.oldValue !== null && change.oldValue !== undefined && change.oldValue !== "";
  const hasNew = change.newValue !== null && change.newValue !== undefined && change.newValue !== "";

  // Archive / restore for deletedAt
  if (change.field === "deletedAt") {
    if (hasNew && !hasOld) return translate("Material archived", "تم أرشفة المادة");
    if (hasOld && !hasNew) return translate("Material restored", "تم استعادة المادة");
  }

  const format = (value: unknown) =>
    formatMaterialChangeValue({
      field: change.field,
      value,
      locale,
      currency,
      resolveSubCategoryTitle,
    });

  if (hasOld && hasNew) {
    return translate(
      `${label} changed from ${format(change.oldValue)} to ${format(change.newValue)}`,
      `${label} تغيّر من ${format(change.oldValue)} إلى ${format(change.newValue)}`,
    );
  }
  if (hasNew) {
    return translate(`${label} set to ${format(change.newValue)}`, `${label} أصبح ${format(change.newValue)}`);
  }
  if (hasOld) {
    return translate(
      `${label} cleared (was ${format(change.oldValue)})`,
      `${label} أُزيل (كان ${format(change.oldValue)})`,
    );
  }
  return label;
}

export function getMaterialChangeSourceLabel(
  source: MaterialChangeHistorySource,
  translate: (en: string, ar: string) => string,
): string {
  if (source === "unit_conversion") return translate("Alternate unit", "وحدة بديلة");
  if (source === "manufactured_bom") return translate("Manufactured BOM", "قائمة مواد التصنيع");
  return translate("Material", "المادة");
}

/** Short event headline; action is shown separately as a badge. */
export function getMaterialChangeEventTitle({
  source,
  action,
  subject,
  translate,
  formatUnit,
}: {
  source: MaterialChangeHistorySource;
  action: string;
  subject: string | null;
  translate: (en: string, ar: string) => string;
  formatUnit?: (unit: string) => string;
}): string {
  if (source === "material") {
    if (action === "insert") return translate("Material created", "تم إنشاء المادة");
    if (action === "delete") return translate("Material deleted", "تم حذف المادة");
    return translate("Material updated", "تم تحديث المادة");
  }

  if (source === "unit_conversion") {
    const unitLabel = subject ? (formatUnit?.(subject) ?? subject) : null;
    if (unitLabel) return unitLabel;
    if (action === "insert") return translate("Alternate unit added", "تمت إضافة وحدة بديلة");
    if (action === "delete") return translate("Alternate unit removed", "تمت إزالة وحدة بديلة");
    return translate("Alternate unit updated", "تم تحديث وحدة بديلة");
  }

  // manufactured_bom
  if (subject) return subject;
  if (action === "insert") return translate("BOM component added", "تمت إضافة مكوّن قائمة المواد");
  if (action === "delete") return translate("BOM component removed", "تمت إزالة مكوّن قائمة المواد");
  return translate("BOM component updated", "تم تحديث مكوّن قائمة المواد");
}

export function hasMaterialChangeValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}
