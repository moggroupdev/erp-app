import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import useDataHandler from "@/hooks/use-data-handler";
import useDepartments from "@/contexts/departments/hook";
import handleRequest from "@/lib/helpers/handle-request";
import departmentsApi from "@/lib/api/departments";
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

  const { setData: setDepartments } = useDepartments();

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

  const { privateRequest, loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation Layer
    if (!nameEn.trim()) return setError(translate("Please enter department name", "يرجي إدخال اسم القسم"));
    if (!nameAr.trim()) return setError(translate("Please enter department name (Arabic)", "يرجي إدخال اسم القسم بالعربية"));

    handleRequest(locale, setLoading, setError, async () => {
      const response = departmentToUpdate
        ? await departmentsApi.update({ privateRequest, id: departmentToUpdate.id, dto: { nameEn, nameAr } })
        : await departmentsApi.create({ privateRequest, dto: { nameEn, nameAr } });

      setDepartments((prev) =>
        departmentToUpdate
          ? prev.map((department) => (department.id === departmentToUpdate.id ? response : department))
          : [...prev, response],
      );

      handleClose();
    });
  }

  function handleClose() {
    close();
    setTimeout(() => {
      if (departmentToUpdate) setDepartmentToUpdate(null);
      else reset();
      setError("");
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
          label={translate("Name", "الاسم")}
          placeholder={translate("Enter Name", "أدخل الاسم")}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
          radius="md"
        />

        <TextInput
          label={translate("Name (Arabic)", "الاسم (العربية)")}
          placeholder={translate("Enter Name (Arabic)", "أدخل الاسم (العربية)")}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
          radius="md"
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" radius="md" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={!isReadyToSubmit} radius="md" fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
