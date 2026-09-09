import { useI18n } from "@/lib/i18n/hooks";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type ProductionDepartmentManagerAssignment } from "@/types/production-department-managers";
import { CreatorLink } from "@/components/ui/entity-details";
import ProductionDepartmentIcon from "./production-department-icon";

export default function ProductionDepartmentManagerCard({
  assignment,
  openUpdateModal,
}: {
  assignment: ProductionDepartmentManagerAssignment;
  openUpdateModal: (() => void) | null;
}) {
  const { locale, translate } = useI18n();

  const label = getProductionSubDepartmentLabel(assignment.department, locale);

  const tile = (
    <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.06)]">
      <ProductionDepartmentIcon department={assignment.department} className="h-[62%] w-[62%]" />
    </div>
  );

  return (
    <article className="flex w-full flex-col items-center">
      {openUpdateModal ? (
        <button
          type="button"
          onClick={openUpdateModal}
          className="group w-full rounded-2xl p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#017E84]/40"
          title={translate("Assign managers", "تعيين المدراء")}
          aria-label={translate(`Assign managers for ${label}`, `تعيين المدراء لـ ${label}`)}
        >
          {tile}
        </button>
      ) : (
        <div className="group w-full">{tile}</div>
      )}

      <div className="flex w-full flex-col items-center gap-1.5 px-1 pt-3 text-center">
        <h3 className="text-[0.95rem] leading-5 font-medium text-gray-700">{label}</h3>

        <div className="flex min-h-10 flex-col items-center gap-1 text-xs text-gray-400 [&_a]:text-gray-500 [&_a]:hover:text-gray-700">
          <span className="line-clamp-1 max-w-full">
            {assignment.manager ? <CreatorLink creator={assignment.manager} /> : translate("No manager", "بدون مدير")}
          </span>
          {assignment.deputyManager ? (
            <span className="line-clamp-1 max-w-full opacity-80">
              <CreatorLink creator={assignment.deputyManager} />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
