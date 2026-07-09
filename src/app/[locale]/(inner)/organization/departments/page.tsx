"use client";

import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import useDepartments from "@/contexts/departments/hook";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type Department } from "@/types/departments";
import { Button } from "@mantine/core";
import PermissionGuard from "@/components/guards/permission";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import DepartmentModal from "./components/department-modal";
import DepartmentCard from "./components/department-card";
import DepartmentsLoadingSkeleton from "./components/departments-loading-skeleton";

const title = { en: "Departments", ar: "الأقسام" };

export default function Page() {
  const { translate } = useI18n();

  useDocumentTitle(translate(title.en, title.ar), "dashboard");

  const { loading, error, data: departments, reload } = useDepartments();

  const canUpdateDepartments = useHasPermission(PERMISSIONS.UPDATE_DEPARTMENT);

  // ========== Handle Modals ==========

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [departmentToUpdate, setDepartmentToUpdate] = useState<Department | null>(null);

  function handleOpenUpdateModal(department: Department) {
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

        <PermissionGuard permission={PERMISSIONS.ADD_DEPARTMENT}>
          <Button color="blue" variant="light" radius="md" onClick={openModal}>
            {translate("Add New Department", "إضافة قسم جديد")}
          </Button>
        </PermissionGuard>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((department: Department) => (
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
