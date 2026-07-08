import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/hooks";
import { Vendor } from "@/types/vendor";
import handleRequest from "@/lib/helpers/handle-request";
import useDataHandler from "@/hooks/use-data-handler";
import vendorsApi from "@/lib/api/vendors";
import { validationRegex } from "@/lib/constants/regex";
import { TextInput, Button, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";

export default function VendorModal({
  opened,
  close,
  vendorToUpdate,
  setVendorToUpdate,
  isForList = false,
  callback,
}: {
  opened: boolean;
  close: () => void;
  vendorToUpdate: Vendor | null;
  setVendorToUpdate: React.Dispatch<React.SetStateAction<Vendor | null>>;
  isForList?: boolean;
  callback: (vendor: Vendor) => void;
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
    if (vendorToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(vendorToUpdate.name);
      setPhone(vendorToUpdate.phone || "");
      setEmail(vendorToUpdate.email || "");
      setNotes(vendorToUpdate.notes || "");
    } else reset();
  }, [vendorToUpdate]);

  const { privateRequest, loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation Layer
    if (!name.trim()) return setError(translate("Please enter the vendor's name.", "يرجى إدخال اسم المورد."));
    if (!validationRegex.name.test(name))
      return setError(translate("The vendor's name contains invalid characters.", "اسم المورد يحتوي على أحرف غير صالحة."));
    if (phone && !validationRegex.globalPhone.test(phone))
      return setError(translate("Please enter a valid phone number.", "يرجى إدخال رقم هاتف صالح."));
    if (email && !validationRegex.email.test(email))
      return setError(translate("Please enter a valid email address.", "يرجى إدخال عنوان بريد إلكتروني صالح."));

    handleRequest(locale, setLoading, setError, async () => {
      const dto = { name, phone: phone || null, email: email || null, notes: notes || null };

      const response = vendorToUpdate
        ? await vendorsApi.update({ privateRequest, id: vendorToUpdate.id, dto })
        : await vendorsApi.create({ privateRequest, dto });

      callback(response);
      handleClose();
    });
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setError("");
      if (isForList) {
        if (vendorToUpdate) setVendorToUpdate(null);
        else reset();
      }
    }, 250);
  }

  const title = translate(`${vendorToUpdate ? "Edit" : "Add"} Vendor`, `${vendorToUpdate ? "تعديل المورد" : "إضافة مورد"}`);

  const isRequiredInputFilled = !!name;

  const isDataChanged = vendorToUpdate
    ? name !== vendorToUpdate.name ||
      (phone || null) !== vendorToUpdate.phone ||
      (email || null) !== vendorToUpdate.email ||
      (notes || null) !== vendorToUpdate.notes
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (vendorToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={translate("Vendor Name", "اسم المورد")}
          placeholder={translate("Enter Vendor Name", "أدخل اسم المورد")}
          required
          autoFocus
          flex={1}
          radius="md"
        />

        <TextInput
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          label={translate("Phone", "الهاتف")}
          placeholder={translate("Enter Phone", "أدخل الهاتف")}
          required
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
          label={translate("Notes", "الملاحظات")}
          placeholder={translate("Enter Notes", "أدخل الملاحظات")}
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
