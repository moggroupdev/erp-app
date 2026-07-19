import { useI18n } from "@/lib/i18n/hooks";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getMaterialTypeLabel } from "@/lib/constants/enums/material-types";
import { getMaterialUnitLabel } from "@/lib/constants/enums/material-units";
import useMaterialCategories from "@/hooks/reference/use-material-categories";
import { type MaterialWithCreator } from "@/types/material";
import { Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";

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
      key: translate("Status", "الحالة"),
      value: isDeleted ? (
        <span className="text-red-600">{translate("Deleted", "محذوف")}</span>
      ) : (
        <span className="text-teal-600">{translate("Active", "نشط")}</span>
      ),
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
      key: translate("Unit", "الوحدة"),
      value: getMaterialUnitLabel(material.unit, locale),
    },
    { key: translate("Quantity", "الكمية"), value: material.quantity },
    { key: translate("Unit Cost", "تكلفة الوحدة"), value: material.unitCost },
    {
      key: translate("Minimum Stock", "الحد الأدنى للمخزون"),
      value: material.minimumStock ?? <EmptyValue />,
    },
    { key: translate("Created By", "أنشئ بواسطة"), value: material.createdBy.name },
    {
      key: translate("Registration Date", "تاريخ التسجيل"),
      value: formatDateAndTime(material.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(material.deletedAt!, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{material.title}</h2>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(material.deletedAt!, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />
    </section>
  );
}
