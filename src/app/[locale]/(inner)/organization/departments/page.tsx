"use client";

import { useState } from "react";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useHasPermission from "@/hooks/use-has-permission";
import useDepartments from "@/hooks/reference/use-departments";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { type DepartmentWithManager } from "@/types/departments";
import { Menu } from "@mantine/core";
import { Factory, Plus } from "lucide-react";
import ErrorSection from "@/components/ui/sections/error";
import EmptySection from "@/components/ui/sections/empty";
import RefetchButton from "@/components/ui/refetch-button";
import ActionsMenu from "@/components/ui/actions-menu";
import DepartmentModal from "@/components/global/data-modals/department-modal";
import DepartmentCard from "./components/department-card";
import DepartmentsLoadingSkeleton from "./components/departments-loading-skeleton";

const title = { en: "Departments", ar: "الأقسام" };

export default function Page() {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  useDocumentTitle(translate(title.en, title.ar), "dashboard");

  const { loading, error, data: departments, reload } = useDepartments();

  const canUpdateDepartments = useHasPermission(PERMISSIONS.UPDATE_DEPARTMENT);
  const canReadProductionDepartmentManagers = useHasPermission(PERMISSIONS.READ_PRODUCTION_DEPARTMENT_MANAGERS);
  const canAddDepartment = useHasPermission(PERMISSIONS.ADD_DEPARTMENT);

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

        <div className="flex items-center gap-3">
          <RefetchButton isFetching={loading} onRefetch={reload} />
          <ActionsMenu>
            {canAddDepartment && (
              <Menu.Item leftSection={<Plus size={14} />} onClick={openModal}>
                {translate("Add new department", "إضافة قسم جديد")}
              </Menu.Item>
            )}
            {canAddDepartment && canReadProductionDepartmentManagers && <Menu.Divider />}
            {canReadProductionDepartmentManagers && (
              <Menu.Item
                component={Link}
                href={getLocalizedHref("/organization/departments/production-department-managers")}
                leftSection={<Factory size={14} />}
              >
                {translate("Show production departments", "عرض أقسام الإنتاج")}
              </Menu.Item>
            )}
          </ActionsMenu>
        </div>
      </header>

      {loading ? (
        <DepartmentsLoadingSkeleton />
      ) : error ? (
        <ErrorSection
          errorTitle={translate("Error loading departments", "خطأ في تحميل الأقسام")}
          errorMessage={error}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: reload }}
          className="rounded-lg border border-clay-100"
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
