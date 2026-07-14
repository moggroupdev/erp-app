import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/use-departments";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getPermissionLabel } from "@/lib/constants/enums/permissions";
import { type RoleWithPermissions } from "@/types/roles";
import { Badge, Divider, Table } from "@mantine/core";
import CopyButton from "@/components/ui/copy-button";
import { Building2, KeyRound, Percent, Shield } from "lucide-react";

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
    <div className="overflow-x-auto rounded-xl bg-gray-50 p-2">
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

export default function RoleDetails({ role }: { role: RoleWithPermissions }) {
  const { locale, translate } = useI18n();
  const { data: departments } = useDepartments();

  const departmentName = useMemo(() => {
    if (!role.departmentId) return null;
    const department = departments.find((d) => d.id === role.departmentId);
    return department ? translate(department.nameEn, department.nameAr) : null;
  }, [departments, role.departmentId, translate]);

  const sortedPermissions = useMemo(() => [...role.permissions].sort((a, b) => a.localeCompare(b)), [role.permissions]);

  const rows: DetailRow[] = [
    { key: translate("Role ID", "معرف الدور"), value: role.id, mono: true, copyText: role.id },
    { key: translate("Name", "الاسم"), value: role.name },
    {
      key: translate("Description", "الوصف"),
      value: role.description ? <span className="font-normal whitespace-pre-wrap">{role.description}</span> : <EmptyValue />,
    },
    {
      key: translate("Max Discount", "أقصى خصم"),
      value:
        role.maxDiscountPct != null ? (
          <span className="inline-flex items-center gap-1">
            <Percent size={14} className="text-teal-600" />
            {role.maxDiscountPct}
          </span>
        ) : (
          <EmptyValue />
        ),
    },
    {
      key: translate("Department", "القسم"),
      value: departmentName ? (
        <span className="inline-flex items-center gap-1.5">
          <Building2 size={14} className="text-violet-600" />
          {departmentName}
        </span>
      ) : (
        <EmptyValue />
      ),
    },
    { key: translate("Created By", "أنشئ بواسطة"), value: role.createdBy.name },
    {
      key: translate("Created At", "تاريخ الإنشاء"),
      value: formatDateAndTime(role.createdAt, locale),
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <Divider variant="dashed" />

      <header className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600">
            <Shield size={28} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{role.name}</h2>
            {role.description && <p className="max-w-2xl text-sm text-gray-500">{role.description}</p>}
          </div>
        </div>

        <Badge size="lg" variant="light" color="blue" radius="md" leftSection={<KeyRound size={14} />}>
          {translate(`${role.permissions.length} Permissions`, `${role.permissions.length} صلاحيات`)}
        </Badge>
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />

      <section className="flex flex-col gap-4">
        <h4 className="text-lg font-semibold text-gray-900">{translate("Permissions", "الصلاحيات")}</h4>

        {sortedPermissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {translate("This role has no permissions assigned.", "هذا الدور لا يحتوي على صلاحيات.")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {sortedPermissions.map((permission) => (
              <Badge key={permission} variant="light" color="indigo" radius="md" className="normal-case">
                {getPermissionLabel(permission, locale)}
              </Badge>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
