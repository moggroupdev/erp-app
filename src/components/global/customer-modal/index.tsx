import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import { Customer } from "@/types/customer";
import handleRequest from "@/lib/helpers/handle-request";
import useDataHandler from "@/hooks/use-data-handler";
import customersApi from "@/lib/api/customers";
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
  callback,
}: {
  opened: boolean;
  close: () => void;
  customerToUpdate: Customer | null;
  setCustomerToUpdate: React.Dispatch<React.SetStateAction<Customer | null>>;
  isForList?: boolean;
  callback: (customer: Customer) => void;
}) {
  const { locale, translate, translation } = useI18n();

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

  const { privateRequest, loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation Layer
    if (!name.trim()) return setError(translate("Please enter the customer's name.", "يرجى إدخال اسم العميل."));
    if (!validationRegex.name.test(name))
      return setError(translate("The customer's name contains invalid characters.", "اسم العميل يحتوي على أحرف غير صالحة."));
    if (phone && !validationRegex.globalPhone.test(phone))
      return setError(translate("Please enter a valid phone number.", "يرجى إدخال رقم هاتف صالح."));
    if (email && !validationRegex.email.test(email))
      return setError(translate("Please enter a valid email address.", "يرجى إدخال عنوان بريد إلكتروني صالح."));

    handleRequest(locale, setLoading, setError, async () => {
      const dto = { name, phone: phone || null, email: email || null, notes: notes || null };

      let customerResponse: Customer;

      if (customerToUpdate) customerResponse = await customersApi.update({ privateRequest, id: customerToUpdate.id, dto });
      else customerResponse = await customersApi.create({ privateRequest, dto });

      callback(customerResponse);
      handleClose();
    });
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setError("");
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
        />

        <TextInput
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          label={translate("Phone", "الهاتف")}
          placeholder={translate("Enter Phone", "أدخل الهاتف")}
        />

        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label={translate("Email (Optional)", "البريد الإلكتروني (اختياري)")}
          placeholder={translate("Enter Email", "أدخل البريد الإلكتروني")}
        />

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Enter Notes", "أدخل الملاحظات")}
        />

        <div className="flex gap-2">
          <Button onClick={handleClose} variant="light" color="dark" fullWidth>
            {translation.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={!isReadyToSubmit} fullWidth>
            {title}
          </Button>
        </div>

        {error && <ErrorAlert error={error} />}
      </form>
    </Modal>
  );
}
