import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useRoles from "@/hooks/reference/use-roles";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import { Shield } from "lucide-react";

export type SelectRoleProps = Omit<GenericDataSelectProps, "data" | "rightIcon"> & {
  /**
   * When `undefined`, all roles are listed (e.g. list filters).
   * When `null` or a department id, only org-wide roles and roles for that department are shown.
   */
  departmentId?: string | null;
};

export default function SelectRole({ departmentId, ...props }: SelectRoleProps) {
  const { translate } = useI18n();

  const { data: roles, loading, error } = useRoles();

  const data = useMemo(() => {
    const filtered =
      departmentId === undefined
        ? roles
        : roles.filter((role) => role.departmentId === null || role.departmentId === departmentId);

    return filtered.map((role) => ({
      value: role.id,
      label: role.name,
    }));
  }, [roles, departmentId]);

  return (
    <DataSelect
      {...props}
      data={data}
      disabled={props.disabled || loading}
      error={props.error || error}
      placeholder={props.placeholder || translate("Select role", "اختر الدور")}
      rightIcon={<Shield size={15} className="pointer-events-none text-gray-400" />}
    />
  );
}
