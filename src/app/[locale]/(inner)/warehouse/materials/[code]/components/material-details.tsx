import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { type MaterialWithCreator } from "@/types/material";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function MaterialDetails({ material }: { material: MaterialWithCreator }) {
  const { locale, translate } = useI18n();
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
    { key: translate("Unit Price", "سعر الوحدة"), value: material.unitPrice },
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

  return <EntityDetails title={material.title} deletedAt={material.deletedAt} rows={rows} />;
}
