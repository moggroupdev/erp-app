"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import useDepartments from "@/hooks/use-departments";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type DepartmentWithManager } from "@/types/departments";
import { Button } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RefetchButton from "@/components/ui/refetch-button";
import DepartmentModal from "./components/department-modal";
import DepartmentCard from "./components/department-card";
import DepartmentsLoadingSkeleton from "./components/departments-loading-skeleton";

const title = { en: "Departments", ar: "الأقسام" };

export default function Page() {
  const { translate } = useI18n();

  useDocumentTitle(translate(title.en, title.ar), "dashboard");

  const { loading, error, data: departments, reload } = useDepartments();

  const canUpdateDepartments = useHasPermission(PERMISSIONS.UPDATE_DEPARTMENT);

  // ========================= MODALS =========================

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [departmentToUpdate, setDepartmentToUpdate] = useState<DepartmentWithManager | null>(null);

  function handleOpenUpdateModal(department: DepartmentWithManager) {
    setDepartmentToUpdate(department);
    openModal();
  }

  return (
    <div className="root-flex-1 flex h-full flex-col gap-4">
      <header className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-col gap-2">
          <h1>{translate(title.en, title.ar)}</h1>
          <p className="text-gray-500">
            {translate("Manage your departments and their managers.", "إدارة الأقسام والمدراء.")}
          </p>
        </div>

        <div className="flex gap-2">
          <RefetchButton isFetching={loading} onRefetch={reload} />
          <PermissionGuard permission={PERMISSIONS.ADD_DEPARTMENT}>
            <Button color="blue" variant="light" radius="md" onClick={openModal}>
              {translate("Add New Department", "إضافة قسم جديد")}
            </Button>
          </PermissionGuard>
        </div>
      </header>

      {loading ? (
        <DepartmentsLoadingSkeleton />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading departments", "خطأ في تحميل الأقسام")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: reload }}
          className="rounded-lg border border-red-100"
        />
      ) : departments.length === 0 ? (
        <EmptySection
          useDefaultImg
          message={translate("No departments found", "لا توجد أقسام")}
          className="rounded-lg bg-white shadow"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              openUpdateModal={canUpdateDepartments ? () => handleOpenUpdateModal(department) : null}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DepartmentModal
        opened={modalOpened}
        close={closeModal}
        departmentToUpdate={departmentToUpdate}
        setDepartmentToUpdate={setDepartmentToUpdate}
      />
    </div>
  );
}
