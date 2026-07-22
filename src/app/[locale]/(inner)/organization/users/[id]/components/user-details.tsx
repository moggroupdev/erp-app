import { useI18n } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { UserWithCreator } from "@/types/user";
import { Badge } from "@mantine/core";
import { UserCog } from "lucide-react";
import EntityDetails, { CreatorLink, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

export default function UserDetails({ user }: { user: UserWithCreator }) {
  const { locale, translate } = useI18n();
  const { helpers: departmentHelpers } = useDepartments();
  const { helpers: roleHelpers } = useRoles();

  const isDeleted = !!user.deletedAt;

  const department = departmentHelpers.getDepartmentById(user.departmentId);
  const role = roleHelpers.getRoleById(user.roleId);

  const rows: DetailRow[] = [
    { key: translate("Code", "الكود"), value: user.code, mono: true, copyText: user.code },
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
      value: <CreatorLink creator={user.createdBy} />,
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
    <EntityDetails
      title={user.name}
      icon={UserCog}
      titleAside={
        user.isAdmin ? (
          <Badge size="lg" variant="light" color="dark">
            {translate("Admin", "مسؤول")}
          </Badge>
        ) : undefined
      }
      deletedAt={user.deletedAt}
      rows={rows}
    />
  );
}
