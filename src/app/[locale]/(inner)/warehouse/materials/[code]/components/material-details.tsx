import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { formatMoney } from "@/lib/helpers/format-money";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { type MaterialWithCreator } from "@/types/material";
import { PackageSearch } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function MaterialDetails({ material }: { material: MaterialWithCreator }) {
  const { locale, translate, translation } = useI18n();
  const { helpers } = useMaterialCategories();

  const isDeleted = !!material.deletedAt;
  const subCategory = helpers.getMaterialCategorySubById(material.subCategoryId);
  const mainCategory = subCategory ? helpers.getMaterialCategoryMainById(subCategory.mainCategoryId) : null;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: material.code, mono: true, copyText: material.code },
    {
      key: translate("Legacy Code", "الكود القديم"),
      value: material.legacyCode ? <span className="font-mono">{material.legacyCode}</span> : <EmptyValue />,
      copyText: material.legacyCode || undefined,
    },
    {
      key: translate("Description", "الوصف"),
      value: material.description ? (
        <span className="font-normal whitespace-pre-wrap">{material.description}</span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Main Category", "الفئة الرئيسية"),
      value: mainCategory?.title || <EmptyValue />,
    },
    {
      key: translate("Subcategory", "الفئة الفرعية"),
      value: subCategory?.title || <EmptyValue />,
    },
    {
      key: translate("Material Type", "نوع المادة"),
      value: getMaterialTypeLabel(material.materialType, locale),
    },
    {
      key: translate("Unit of Measurement", "وحدة القياس"),
      value: getMaterialUnitLabel(material.unitOfMeasurement, locale),
    },
    { key: translate("Quantity", "الكمية"), value: material.quantity },
    { key: translate("Unit Price", "سعر الوحدة"), value: formatMoney(material.unitPrice, translation.currency) },
    ...(material.marketUnitPrice != null
      ? [
          {
            key: translate("Market Price", "سعر السوق"),
            value: formatMoney(material.marketUnitPrice, translation.currency),
          },
          {
            key: translate("Market Price Set At", "تاريخ تحديد سعر السوق"),
            value: formatDateAndTime(material.marketUnitPriceSetAt!, locale),
          },
          {
            key: translate("Market Price Set By", "حدد سعر السوق بواسطة"),
            value: (
              <CreatorLink
                creator={
                  typeof material.marketUnitPriceSetBy === "object" ? material.marketUnitPriceSetBy : null
                }
              />
            ),
          },
        ]
      : []),
    {
      key: translate("Minimum Stock", "الحد الأدنى للمخزون"),
      value: material.minimumStock ?? <EmptyValue />,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={material.createdBy} />,
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(material.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(material.deletedAt!, locale) }]
      : []),
  ];

  return <EntityDetails title={material.title} icon={PackageSearch} deletedAt={material.deletedAt} rows={rows} />;
}
