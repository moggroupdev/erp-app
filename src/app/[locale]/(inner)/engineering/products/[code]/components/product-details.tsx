import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { type ProductWithCreator } from "@/types/product";
import { PackageSearch } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function ProductDetails({ product }: { product: ProductWithCreator }) {
  const { locale, translate } = useI18n();
  const { helpers } = useProductCategories();

  const isDeleted = !!product.deletedAt;
  const subCategory = helpers.getProductCategorySubById(product.subCategoryId);
  const mainCategory = subCategory ? helpers.getProductCategoryMainById(subCategory.mainCategoryId) : null;

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: product.code, mono: true, copyText: product.code },
    {
      key: translate("Description", "الوصف"),
      value: product.description ? (
        <span className="font-normal whitespace-pre-wrap">{product.description}</span>
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
      key: translate("Source Type", "نوع المصدر"),
      value: getProductSourceTypeLabel(product.sourceType, locale),
    },
    {
      key: translate("Estimated Production Time", "وقت الإنتاج المقدر"),
      value:
        product.estimatedProductionTime !== null ? (
          translate(`${product.estimatedProductionTime} days`, `${product.estimatedProductionTime} أيام`)
        ) : (
          <EmptyValue />
        ),
    },
    {
      key: translate("Pricing Factor", "معامل التسعير"),
      value: product.pricingFactor,
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={product.createdBy} />,
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(product.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(product.deletedAt!, locale) }]
      : []),
  ];

  return <EntityDetails title={product.title} icon={PackageSearch} deletedAt={product.deletedAt} rows={rows} />;
}
