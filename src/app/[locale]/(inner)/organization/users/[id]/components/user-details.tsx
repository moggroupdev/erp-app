import { useI18n } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { UserWithCreator } from "@/types/user";
import { Badge, Divider, Table } from "@mantine/core";
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

export default function UserDetails({ user }: { user: UserWithCreator }) {
  const { locale, translate } = useI18n();
  const { helpers: departmentHelpers } = useDepartments();
  const { helpers: roleHelpers } = useRoles();

  const isDeleted = !!user.deletedAt;

  const department = departmentHelpers.getDepartmentById(user.departmentId);
  const role = roleHelpers.getRoleById(user.roleId);

  const rows: DetailRow[] = [
    { key: translate("User ID", "معرف المستخدم"), value: user.id, mono: true, copyText: user.id },
    { key: translate("Code", "الكود"), value: user.code, mono: true, copyText: user.code },
    {
      key: translate("Status", "الحالة"),
      value: isDeleted ? (
        <span className="text-red-600">{translate("Deleted", "محذوف")}</span>
      ) : (
        <span className="text-teal-600">{translate("Active", "نشط")}</span>
      ),
    },
    {
      key: translate("Phone", "الهاتف"),
      value: user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : <EmptyValue />,
    },
    {
      key: translate("Email", "البريد الإلكتروني"),
      value: user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : <EmptyValue />,
    },
    {
      key: translate("Phone Verified", "الهاتف موثّق"),
      value: user.isPhoneVerified ? translate("Yes", "نعم") : translate("No", "لا"),
    },
    {
      key: translate("Email Verified", "البريد موثّق"),
      value: user.isEmailVerified ? translate("Yes", "نعم") : translate("No", "لا"),
    },
    {
      key: translate("Department", "القسم"),
      value: department ? translate(department.nameEn, department.nameAr) : <EmptyValue />,
    },
    {
      key: translate("Production Sub-Department", "القسم الفرعي للإنتاج"),
      value: user.productionSubDepartment ? (
        getProductionSubDepartmentLabel(user.productionSubDepartment, locale)
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Role", "الدور"),
      value: user.isAdmin ? (
        <Badge size="sm" variant="light" color="dark">
          {translate("Admin", "مسؤول")}
        </Badge>
      ) : role ? (
        role.name
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: user.createdBy ? (
        <Link href={`/organization/users/${user.createdBy.id}`} className="hover:underline">
          {user.createdBy.name}
        </Link>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(user.createdAt, locale),
    },
    ...(isDeleted
      ? [{ key: translate("Deletion Date", "تاريخ الحذف"), value: formatDateAndTime(user.deletedAt!, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-xl">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-3 rounded-xl bg-gray-100 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{user.name}</h2>
          {user.isAdmin && (
            <Badge size="lg" variant="light" color="dark">
              {translate("Admin", "مسؤول")}
            </Badge>
          )}
        </div>

        {isDeleted && (
          <p className="text-sm font-medium text-red-600">
            {translate("Deleted", "محذوف")} - {formatDateAndTime(user.deletedAt!, locale)}
          </p>
        )}
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />
    </section>
  );
}
