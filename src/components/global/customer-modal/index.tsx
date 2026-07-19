import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { Customer } from "@/types/customer";
import usePrivateRequest from "@/hooks/use-private-request";
import customersApi from "@/lib/api/customers";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { validationRegex } from "@/lib/constants/regex";
import { TextInput, Button, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

export default function CustomerModal({
  opened,
  close,
  customerToUpdate,
  setCustomerToUpdate,
  isForList = false,
  onSuccess,
}: {
  opened: boolean;
  close: () => void;
  customerToUpdate: Customer | null;
  setCustomerToUpdate: React.Dispatch<React.SetStateAction<Customer | null>>;
  isForList?: boolean;
  onSuccess?: () => void;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  useEffect(() => {
    if (customerToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(customerToUpdate.name);
      setPhone(customerToUpdate.phone || "");
      setEmail(customerToUpdate.email || "");
      setNotes(customerToUpdate.notes || "");
    } else reset();
  }, [customerToUpdate]);

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = { name, phone: phone || null, email: email || null, notes: notes || null };
      return customerToUpdate
        ? await customersApi.update({ privateRequest, id: customerToUpdate.id, dto })
        : await customersApi.create({ privateRequest, dto });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      onSuccess?.();
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!name.trim()) return setValidationError(translate("Please enter the customer's name.", "يرجى إدخال اسم العميل."));
    if (!validationRegex.name.test(name))
      return setValidationError(
        translate("The customer's name contains invalid characters.", "اسم العميل يحتوي على أحرف غير صالحة."),
      );
    if (phone && !validationRegex.globalPhone.test(phone))
      return setValidationError(translate("Please enter a valid phone number.", "يرجى إدخال رقم هاتف صالح."));
    if (email && !validationRegex.email.test(email))
      return setValidationError(translate("Please enter a valid email address.", "يرجى إدخال عنوان بريد إلكتروني صالح."));

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      if (isForList) {
        if (customerToUpdate) setCustomerToUpdate(null);
        else reset();
      }
    }, 250);
  }

  const title = translate(
    `${customerToUpdate ? "Edit" : "Add"} Customer`,
    `${customerToUpdate ? "تعديل العميل" : "إضافة عميل"}`,
  );

  const isRequiredInputFilled = !!name;

  const isDataChanged = customerToUpdate
    ? name !== customerToUpdate.name ||
      (phone || null) !== customerToUpdate.phone ||
      (email || null) !== customerToUpdate.email ||
      (notes || null) !== customerToUpdate.notes
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (customerToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={translate("Customer Name", "اسم العميل")}
          placeholder={translate("Enter Customer Name", "أدخل اسم العميل")}
          required
          autoFocus
          flex={1}
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

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes (Optional)", "الملاحظات (اختياري)")}
          placeholder={translate("Enter Notes", "أدخل الملاحظات")}
          radius="md"
          autosize
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
