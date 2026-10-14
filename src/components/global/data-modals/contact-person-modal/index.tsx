import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi from "@/lib/api/customers";
import suppliersApi from "@/lib/api/suppliers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { validationRegex } from "@/lib/constants/regex";
import { Button, Checkbox, TextInput } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

type ContactPersonModalProps = {
  opened: boolean;
  close: () => void;
  isFirstContact: boolean;
} & ({ entityType: "customer"; entityId: string } | { entityType: "supplier"; entityId: string });

export default function ContactPersonModal({ opened, close, entityType, entityId, isFirstContact }: ContactPersonModalProps) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  function reset() {
    setName("");
    setJobTitle("");
    setPhone("");
    setEmail("");
    setIsPrimary(isFirstContact);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPrimary(isFirstContact);
  }, [isFirstContact]);

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = {
        name: name.trim(),
        jobTitle: jobTitle.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isPrimary: isFirstContact || isPrimary,
      };
      if (entityType === "customer") return await customersApi.addContactPerson({ privateRequest, id: entityId, dto });
      return await suppliersApi.addContactPerson({ privateRequest, id: entityId, dto });
    },
    onSuccess: async () => {
      const contactPersonsKey =
        entityType === "customer" ? queryKeys.customers.contactPersons(entityId) : queryKeys.suppliers.contactPersons(entityId);
      await queryClient.invalidateQueries({ queryKey: contactPersonsKey });
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!name.trim()) return setValidationError(translate("Please enter the contact name.", "يرجى إدخال اسم شخص الاتصال."));
    if (phone && !validationRegex.globalPhone.test(phone))
      return setValidationError(translate("Please enter a valid phone number.", "يرجى إدخال رقم هاتف صالح."));
    if (email && !validationRegex.email.test(email))
      return setValidationError(translate("Please enter a valid email address.", "يرجى إدخال عنوان بريد إلكتروني صالح."));

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      reset();
      setValidationError("");
      mutation.reset();
    }, 250);
  }

  const title = translate("Add Contact Person", "إضافة شخص اتصال");
  const isReadyToSubmit = !!name.trim();

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={translate("Name", "الاسم")}
          placeholder={translate("Enter name", "أدخل الاسم")}
          required
          autoFocus
          radius="md"
        />

        <TextInput
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          label={translate("Job Title (Optional)", "المسمى الوظيفي (اختياري)")}
          placeholder={translate("Enter job title", "أدخل المسمى الوظيفي")}
          radius="md"
        />

        <TextInput
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          label={translate("Phone (Optional)", "الهاتف (اختياري)")}
          placeholder={translate("Enter Phone", "أدخل الهاتف")}
          radius="md"
        />

        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label={translate("Email (Optional)", "البريد الإلكتروني (اختياري)")}
          placeholder={translate("Enter Email", "أدخل البريد الإلكتروني")}
          radius="md"
        />

        <Checkbox
          checked={isFirstContact || isPrimary}
          onChange={(e) => setIsPrimary(e.currentTarget.checked)}
          label={translate("Set as primary contact", "تعيين كشخص اتصال أساسي")}
          disabled={isFirstContact}
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
