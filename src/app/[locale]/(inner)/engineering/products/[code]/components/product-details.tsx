import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductSourceTypeLabel } from "@/lib/constants/enums/product-source-types";
import useProductCategories from "@/hooks/reference/use-product-categories";
import { type ProductWithCreator } from "@/types/product";
import { Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";
import Link from "next/link";

type DetailRow = {
  key: string;
  value: React.ReactNode;
  mono?: boolean;
  copyText?: string;
};

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function DetailsTable({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-gray-100 p-2">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.key}>
              <Table.Th w="30%" className="text-gray-600">
                {row.key}
              </Table.Th>
              <Table.Td className="font-medium text-gray-900">
                <div className={`flex items-center gap-1.5 ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                  {row.copyText && <CopyButton text={row.copyText} />}
                </div>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}

export default function ProductDetails({ product }: { product: ProductWithCreator }) {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
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
      value: (
        <Link href={getLocalizedHref(`/organization/users/${product.createdBy.id}`)} className="hover:underline">
          {product.createdBy.name}
        </Link>
      ),
    },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(product.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(product.deletedAt!, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{product.title}</h2>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(product.deletedAt!, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />
    </section>
  );
}
