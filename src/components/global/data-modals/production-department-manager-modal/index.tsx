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
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectUser from "@/components/global/selections/remote-based/select-user";

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

  const title = translate(`Assign Managers - ${departmentLabel}`, `تعيين المدراء - ${departmentLabel}`);

  const isDataChanged = assignmentToUpdate
    ? managerId !== assignmentToUpdate.managerId || deputyManagerId !== assignmentToUpdate.deputyManagerId
    : false;

  const isReadyToSubmit = !!assignmentToUpdate && isDataChanged;

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SelectUser
          value={managerId}
          setValue={setManagerId}
          label={translate("Manager", "المدير")}
          placeholder={translate("Search user by name or code", "ابحث عن مستخدم بالاسم أو الكود")}
          excludeIds={deputyManagerId ? [deputyManagerId] : []}
          initialUser={assignmentToUpdate?.manager}
        />

        <SelectUser
          value={deputyManagerId}
          setValue={setDeputyManagerId}
          label={translate("Deputy Manager", "نائب المدير")}
          placeholder={translate("Search user by name or code", "ابحث عن مستخدم بالاسم أو الكود")}
          excludeIds={managerId ? [managerId] : []}
          initialUser={assignmentToUpdate?.deputyManager}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {translate("Save Assignment", "حفظ التعيين")}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
