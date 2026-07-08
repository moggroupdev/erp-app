import { useI18n } from "@/lib/i18n/hooks";
import { type Department } from "@/types/departments";
import { Pencil } from "lucide-react";
import { Button } from "@mantine/core";

export default function DepartmentCard({
  department,
  openUpdateModal,
}: {
  department: Department;
  openUpdateModal: (() => void) | null;
}) {
  const { translate } = useI18n();

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow">
      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold text-gray-800">
              {translate(department.nameEn, department.nameAr)}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{department.manager?.name}</p>
          </div>

          {openUpdateModal && (
            <Button onClick={openUpdateModal} variant="light" radius="md" title={translate("Edit", "تعديل")}>
              <Pencil size={16} />
            </Button>
          )}
        </header>
      </div>
    </article>
  );
}
