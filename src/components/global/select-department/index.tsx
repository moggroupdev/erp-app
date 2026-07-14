import { useI18n } from "@/lib/i18n/hooks";
import useDepartments from "@/hooks/use-departments";
import DataSelect, { GenericDataSelectProps } from "@/components/ui/data-select";
import { Building2 } from "lucide-react";

export type SelectDepartmentProps = Omit<GenericDataSelectProps, "data" | "rightIcon">;

export default function SelectDepartment(props: SelectDepartmentProps) {
  const { translate } = useI18n();

  const { data: departments, loading, error } = useDepartments();

  const data = departments.map((department) => ({
    value: department.id,
    label: translate(department.nameEn, department.nameAr),
  }));

  return (
    <DataSelect
      {...props}
      data={data}
      disabled={loading}
      error={error}
      rightIcon={<Building2 className="pointer-events-none text-gray-400" />}
    />
  );
}
