"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import usePrivateRequest from "@/hooks/use-private-request";
import productionDepartmentManagersApi from "@/lib/api/production-department-managers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type ProductionDepartmentManagerAssignment } from "@/types/production-department-managers";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import LoadingSection from "@/components/ui/sections/loading";
import RefetchButton from "@/components/ui/refetch-button";
import ProductionDepartmentManagerModal from "@/components/global/data-modals/production-department-manager-modal";
import ProductionDepartmentManagerCard from "./components/production-department-manager-card";

const title = { en: "Production Departments", ar: "أقسام الإنتاج" };

export default function Page() {
  const { locale, translate } = useI18n();

  useDocumentTitle(translate(title.en, title.ar), "dashboard");

  const privateRequest = usePrivateRequest();
  const canUpdate = useHasPermission(PERMISSIONS.UPDATE_PRODUCTION_DEPARTMENT_MANAGERS);

  const {
    data: assignments,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.productionDepartmentManagers.all,
    queryFn: ({ signal }) => productionDepartmentManagersApi.list({ privateRequest, signal }),
    staleTime: staleTimes.productionDepartmentManagers,
  });

  const errorMessage = error ? getErrorMessage(locale, error) : "";

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [assignmentToUpdate, setAssignmentToUpdate] = useState<ProductionDepartmentManagerAssignment | null>(null);

  function handleOpenUpdateModal(assignment: ProductionDepartmentManagerAssignment) {
    setAssignmentToUpdate(assignment);
    openModal();
  }

  return (
    <div className="root-flex-1 flex h-full flex-col gap-6 rounded-2xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">{translate(title.en, title.ar)}</h1>
          <p className="text-sm text-gray-500">
            {translate(
              "Assign a manager and deputy manager to each production department.",
              "تعيين مدير ونائب مدير لكل قسم من أقسام الإنتاج.",
            )}
          </p>
        </div>

        <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
      </header>

      {isFetching ? (
        <LoadingSection message={translate("Loading production departments...", "جاري تحميل أقسام الإنتاج...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("Error loading production departments", "خطأ في تحميل أقسام الإنتاج")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
          className="rounded-2xl border border-red-100 bg-white"
        />
      ) : !assignments || assignments.length === 0 ? (
        <EmptySection
          useDefaultImg
          message={translate("No production departments found", "لا توجد أقسام إنتاج")}
          className="rounded-2xl bg-white shadow-sm"
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {assignments.map((assignment) => (
            <ProductionDepartmentManagerCard
              key={assignment.department}
              assignment={assignment}
              openUpdateModal={canUpdate ? () => handleOpenUpdateModal(assignment) : null}
            />
          ))}
        </div>
      )}

      <ProductionDepartmentManagerModal
        opened={modalOpened}
        close={closeModal}
        assignmentToUpdate={assignmentToUpdate}
        setAssignmentToUpdate={setAssignmentToUpdate}
      />
    </div>
  );
}
