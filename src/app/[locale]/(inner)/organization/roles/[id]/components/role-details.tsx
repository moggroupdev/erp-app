import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/reference/use-departments";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getPermissionLabel, PERMISSION_DOMAIN_GROUPS, type Permission } from "@/lib/constants/enums/permissions";
import { type RoleWithCreatorWithPermissions } from "@/types/roles";
import { Badge, Divider } from "@mantine/core";
import { CreatorLink, DetailsTable, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import { Building2, Home, KeyRound, Percent, Shield } from "lucide-react";

export default function RoleDetails({ role }: { role: RoleWithCreatorWithPermissions }) {
  const { locale, translate } = useI18n();
  const { helpers: departmentHelpers } = useDepartments();

  const departmentName = useMemo(() => {
    const department = departmentHelpers.getDepartmentById(role.departmentId);
    return department ? translate(department.nameEn, department.nameAr) : null;
  }, [departmentHelpers, role.departmentId, translate]);

  const permissions = role.permissions ?? [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const permissionGroups = useMemo(() => {
    const grouped: { domain: string; label: { en: string; ar: string }; permissions: Permission[] }[] =
      PERMISSION_DOMAIN_GROUPS.map((group) => ({
        domain: group.domain,
        label: group.label,
        permissions: group.permissions.filter((permission) => permissionSet.has(permission)),
      })).filter((group) => group.permissions.length > 0);

    const known = new Set(PERMISSION_DOMAIN_GROUPS.flatMap((group) => group.permissions));
    const unmatched = permissions.filter((permission) => !known.has(permission));
    if (unmatched.length > 0) {
      grouped.push({
        domain: "other",
        label: { en: "Other", ar: "أخرى" },
        permissions: unmatched.sort((a, b) => a.localeCompare(b)),
      });
    }

    return grouped;
  }, [permissionSet, permissions]);

  const rows: DetailRow[] = [
    { key: translate("Role Name", "اسم الدور"), value: role.name },
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
    {
      key: translate("Home Page", "الصفحة الرئيسية"),
      value: role.homeUrl ? (
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Home size={14} className="text-blue-600" />
          {role.homeUrl}
        </span>
      ) : (
        <EmptyValue />
      ),
    },
    {
      key: translate("Created By", "أنشئ بواسطة"),
      value: <CreatorLink creator={role.createdBy} />,
    },
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
          {translate(`${permissions.length} Permissions`, `${permissions.length} صلاحيات`)}
        </Badge>
      </header>

      <Divider variant="dashed" />

      <DetailsTable rows={rows} />

      <section className="mt-4 flex flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600">
              <KeyRound size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{translate("Permissions", "الصلاحيات")}</h4>
              <p className="mt-0.5 text-sm text-gray-500">
                {translate(
                  "Access rights granted to users with this role, grouped by domain.",
                  "صلاحيات الوصول الممنوحة للمستخدمين بهذا الدور، مجمّعة حسب المجال.",
                )}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {translate(`${permissions.length} selected`, `${permissions.length} محددة`)}
          </span>
        </header>

        {permissionGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/75 px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400">
              <KeyRound size={18} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {translate("No permissions assigned", "لا توجد صلاحيات معيّنة")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {translate("This role currently has no access rights.", "هذا الدور لا يملك أي صلاحيات وصول حاليًا.")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {permissionGroups.map((group) => (
              <div key={group.domain} className="flex flex-col gap-3 rounded-2xl bg-slate-50/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-200 pb-2">
                  <h5 className="text-sm font-semibold text-gray-800">{translate(group.label.en, group.label.ar)}</h5>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {group.permissions.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((permission) => (
                    <Badge key={permission} variant="light" color="indigo" radius="md" className="normal-case">
                      {getPermissionLabel(permission, locale)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
