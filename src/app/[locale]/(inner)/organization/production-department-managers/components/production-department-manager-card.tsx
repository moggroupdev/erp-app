import { Tooltip } from "@mantine/core";
import { useI18n } from "@/lib/i18n/hooks";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type ProductionDepartmentManagerAssignment } from "@/types/production-department-managers";
import { CreatorLink } from "@/components/ui/entity-details";
import { Pencil, UserRound, UsersRound } from "lucide-react";

export default function ProductionDepartmentManagerCard({
  assignment,
  openUpdateModal,
}: {
  assignment: ProductionDepartmentManagerAssignment;
  openUpdateModal: (() => void) | null;
}) {
  const { locale, translate } = useI18n();

  const label = getProductionSubDepartmentLabel(assignment.department, locale);

  return (
    <article className="group flex h-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <h3 className="line-clamp-2 text-lg leading-6 font-semibold text-gray-900">{label}</h3>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <UserRound size={15} className="shrink-0 text-gray-500" />
              <Tooltip withArrow position="bottom" label={translate("Manager", "المدير")}>
                <span className="text-sm">
                  {assignment.manager ? (
                    <CreatorLink creator={assignment.manager} />
                  ) : (
                    translate("No manager assigned", "لم يتم تعيين مدير")
                  )}
                </span>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500">
              <UsersRound size={15} className="shrink-0 text-gray-500" />
              <Tooltip withArrow position="bottom" label={translate("Deputy Manager", "نائب المدير")}>
                <span className="text-sm">
                  {assignment.deputyManager ? (
                    <CreatorLink creator={assignment.deputyManager} />
                  ) : (
                    translate("No deputy manager assigned", "لم يتم تعيين نائب مدير")
                  )}
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
