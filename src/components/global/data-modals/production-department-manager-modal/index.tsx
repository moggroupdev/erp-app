import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import productionDepartmentManagersApi from "@/lib/api/production-department-managers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import { type ProductionDepartmentManagerAssignment } from "@/types/production-department-managers";
import { Button } from "@mantine/core";
import { UserRound, UsersRound } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectUser from "@/components/global/selections/remote-based/select-user";
import ProductionDepartmentIcon from "@/components/global/production-department-icon";

export default function ProductionDepartmentManagerModal({
  opened,
  close,
  assignmentToUpdate,
  setAssignmentToUpdate,
}: {
  opened: boolean;
  close: () => void;
  assignmentToUpdate: ProductionDepartmentManagerAssignment | null;
  setAssignmentToUpdate: React.Dispatch<React.SetStateAction<ProductionDepartmentManagerAssignment | null>>;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [managerId, setManagerId] = useState<string | null>(null);
  const [deputyManagerId, setDeputyManagerId] = useState<string | null>(null);

  function reset() {
    setManagerId(null);
    setDeputyManagerId(null);
  }

  useEffect(() => {
    if (assignmentToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManagerId(assignmentToUpdate.managerId);
      setDeputyManagerId(assignmentToUpdate.deputyManagerId);
    } else reset();
  }, [assignmentToUpdate]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!assignmentToUpdate) throw new Error("No assignment selected");
      return await productionDepartmentManagersApi.assign({
        privateRequest,
        department: assignmentToUpdate.department,
        dto: { managerId, deputyManagerId },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.productionDepartmentManagers.all });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (managerId && deputyManagerId && managerId === deputyManagerId) {
      return setValidationError(
        translate(
          "Manager and deputy manager must be different users.",
          "يجب أن يكون المدير ونائب المدير مستخدمين مختلفين.",
        ),
      );
    }

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setAssignmentToUpdate(null);
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const departmentLabel = assignmentToUpdate
    ? getProductionSubDepartmentLabel(assignmentToUpdate.department, locale)
    : "";

  const isDataChanged = assignmentToUpdate
    ? managerId !== assignmentToUpdate.managerId || deputyManagerId !== assignmentToUpdate.deputyManagerId
    : false;

  const isReadyToSubmit = !!assignmentToUpdate && isDataChanged;

  return (
    <Modal opened={opened} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {assignmentToUpdate && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#F6F7F9] px-4 py-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]">
              <ProductionDepartmentIcon department={assignmentToUpdate.department} className="h-10 w-10" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-lg font-semibold text-gray-800">{departmentLabel}</h3>
              <p className="text-sm text-gray-500">
                {translate("Assign manager and deputy manager", "تعيين المدير ونائب المدير")}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#017E84]/10 text-[#017E84]">
                <UserRound size={16} />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{translate("Manager", "المدير")}</span>
                <span className="text-xs text-gray-400">
                  {translate("Primary head of this department", "المسؤول الرئيسي عن هذا القسم")}
                </span>
              </div>
            </div>
            <SelectUser
              value={managerId}
              setValue={setManagerId}
              placeholder={translate("Search user by name or code", "ابحث عن مستخدم بالاسم أو الكود")}
              excludeIds={deputyManagerId ? [deputyManagerId] : []}
              initialUser={assignmentToUpdate?.manager}
              radius="md"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F06A26]/10 text-[#F06A26]">
                <UsersRound size={16} />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{translate("Deputy Manager", "نائب المدير")}</span>
                <span className="text-xs text-gray-400">
                  {translate("Optional secondary contact", "جهة اتصال ثانوية اختيارية")}
                </span>
              </div>
            </div>
            <SelectUser
              value={deputyManagerId}
              setValue={setDeputyManagerId}
              placeholder={translate("Search user by name or code", "ابحث عن مستخدم بالاسم أو الكود")}
              excludeIds={managerId ? [managerId] : []}
              initialUser={assignmentToUpdate?.deputyManager}
              radius="md"
            />
          </div>
        </div>

        {error && <ErrorAlert error={error} />}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleClose} variant="light" color="gray" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!isReadyToSubmit}
            color="teal"
            radius="md"
            fullWidth
          >
            {translate("Save Assignment", "حفظ التعيين")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
