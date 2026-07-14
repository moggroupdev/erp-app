import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import departmentsApi from "@/lib/api/departments";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query/keys";
import { type Department } from "@/types/departments";
import { Button, TextInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

export default function DepartmentModal({
  opened,
  close,
  departmentToUpdate,
  setDepartmentToUpdate,
}: {
  opened: boolean;
  close: () => void;
  departmentToUpdate: Department | null;
  setDepartmentToUpdate: React.Dispatch<React.SetStateAction<Department | null>>;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");

  function reset() {
    setNameEn("");
    setNameAr("");
  }

  useEffect(() => {
    if (departmentToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameEn(departmentToUpdate.nameEn);
      setNameAr(departmentToUpdate.nameAr);
    } else reset();
  }, [departmentToUpdate]);

  const mutation = useMutation({
    mutationFn: async () => {
      return departmentToUpdate
        ? await departmentsApi.update({ privateRequest, id: departmentToUpdate.id, dto: { nameEn, nameAr } })
        : await departmentsApi.create({ privateRequest, dto: { nameEn, nameAr } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!nameEn.trim())
      return setValidationError(translate("Please enter department English name ", "يرجي إدخال اسم القسم بالانجليزية"));
    if (!nameAr.trim())
      return setValidationError(translate("Please enter department Arabic name", "يرجي إدخال اسم القسم بالعربية"));

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      if (departmentToUpdate) setDepartmentToUpdate(null);
      else reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = translate(
    `${departmentToUpdate ? "Edit" : "Add"} Department`,
    `${departmentToUpdate ? "تعديل القسم" : "إضافة قسم"}`,
  );

  const isRequiredInputFilled = !!(nameEn && nameAr);

  const isDataChanged = departmentToUpdate
    ? nameEn !== departmentToUpdate.nameEn || nameAr !== departmentToUpdate.nameAr
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (departmentToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          label={translate("Name (English)", "الاسم (الانجليزية)")}
          placeholder={translate("Enter the English name of the department", "أدخل اسم القسم بالانجليزية")}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          radius="md"
          required
        />

        <TextInput
          label={translate("Name (Arabic)", "الاسم (العربية)")}
          placeholder={translate("Enter the Arabic name of the department", "أدخل اسم القسم بالعربية")}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          radius="md"
          required
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
