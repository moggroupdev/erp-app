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

const title = { en: "Production Department Managers", ar: "مدراء أقسام الإنتاج" };

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
    <div className="root-flex-1 flex h-full flex-col gap-4">
      <header className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-col gap-2">
          <h1>{translate(title.en, title.ar)}</h1>
          <p className="text-gray-500">
            {translate(
              "Assign a manager and deputy manager to each production department.",
              "تعيين مدير ونائب مدير لكل قسم من أقسام الإنتاج.",
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <RefetchButton isFetching={isFetching} onRefetch={() => refetch()} />
        </div>
      </header>

      {isFetching ? (
        <LoadingSection
          message={translate("Loading production department managers...", "جاري تحميل مدراء أقسام الإنتاج...")}
        />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate(
            "Error loading production department managers",
            "خطأ في تحميل مدراء أقسام الإنتاج",
          )}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => refetch() }}
          className="rounded-lg border border-red-100"
        />
      ) : !assignments || assignments.length === 0 ? (
        <EmptySection
          useDefaultImg
          message={translate("No production departments found", "لا توجد أقسام إنتاج")}
          className="rounded-lg bg-white shadow"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment) => (
            <ProductionDepartmentManagerCard
              key={assignment.department}
              assignment={assignment}
              openUpdateModal={canUpdate ? () => handleOpenUpdateModal(assignment) : null}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductionDepartmentManagerModal
        opened={modalOpened}
        close={closeModal}
        assignmentToUpdate={assignmentToUpdate}
        setAssignmentToUpdate={setAssignmentToUpdate}
      />
    </div>
  );
}
