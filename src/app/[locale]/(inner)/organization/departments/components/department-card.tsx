import Image from "next/image";
import { Tooltip } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import { type Department } from "@/types/departments";
import { Pencil, UserRound } from "lucide-react";

export default function DepartmentCard({
  department,
  openUpdateModal,
}: {
  department: Department;
  openUpdateModal: (() => void) | null;
}) {
  const { translate } = useI18n();

  return (
    <article className="group flex h-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-center h-15 w-15 overflow-hidden rounded-xl border border-gray-200">
            <Image
              src="/images/logo.png"
              alt={translate("Department logo", "شعار القسم")}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="line-clamp-2 text-lg leading-6 font-semibold text-nowrap text-gray-900">
              {translate(department.nameEn, department.nameAr)}
            </h3>

            <div className="flex items-center gap-1.5 text-gray-500">
              <UserRound size={15} className="text-gray-500" />
              <Tooltip
                withArrow
                position="bottom"
                label={translate(`Manager of the department of ${department.nameEn}`, `مدير قسم ${department.nameAr}`)}
              >
                <span className="text-sm">
                  {department.manager?.name || translate("No manager assigned", "لم يتم تعيين مدير")}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {openUpdateModal && (
          <button
            onClick={openUpdateModal}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-500 transition-colors hover:bg-blue-100"
            title={translate("Edit", "تعديل")}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
