import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n/hooks";
import { User } from "@/types/user";
import { PRODUCTION_DEPARTMENT_ID } from "@/lib/constants/global";
import { Gender } from "@/lib/constants/enums/genders";
import { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";
import usePrivateRequest from "@/hooks/use-private-request";
import useRoles from "@/hooks/reference/use-roles";
import usersApi from "@/lib/api/users";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { validationRegex } from "@/lib/constants/regex";
import { TextInput, Button, PasswordInput, Checkbox } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectDepartment from "@/components/global/selections/reference-based/select-department";
import SelectGender from "@/components/global/selections/enum-based/select-gender";
import SelectProductionSubDepartment from "@/components/global/selections/enum-based/select-production-sub-department";
import SelectRole from "@/components/global/selections/reference-based/select-role";

export default function UserModal({
  opened,
  close,
  userToUpdate,
  setUserToUpdate,
  isForList = false,
  onSuccess,
}: {
  opened: boolean;
  close: () => void;
  userToUpdate: User | null;
  setUserToUpdate: React.Dispatch<React.SetStateAction<User | null>>;
  isForList?: boolean;
  onSuccess?: () => void;
}) {
  const { locale, translate, translation } = useI18n();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();

  const { helpers: roleHelpers } = useRoles();

  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [productionSubDepartment, setProductionSubDepartment] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState("");

  const isAdminUser = !!userToUpdate?.isAdmin;
  const isProductionDepartment = departmentId === PRODUCTION_DEPARTMENT_ID;
  const showPasswordField = isLoginEnabled && (!userToUpdate || changePassword || !userToUpdate.isLoginEnabled);

  function reset() {
    setName("");
    setGender(null);
    setPhone("");
    setEmail("");
    setIsLoginEnabled(true);
    setDepartmentId(null);
    setProductionSubDepartment(null);
    setRoleId(null);
    setPassword("");
    setChangePassword(false);
  }

  useEffect(() => {
    if (userToUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(userToUpdate.name);
      setGender(userToUpdate.gender);
      setPhone(userToUpdate.phone || "");
      setEmail(userToUpdate.email || "");
      setIsLoginEnabled(userToUpdate.isLoginEnabled);
      setDepartmentId(userToUpdate.departmentId);
      setProductionSubDepartment(userToUpdate.productionSubDepartment);
      setRoleId(userToUpdate.roleId);
      setPassword("");
      setChangePassword(false);
    } else reset();
  }, [userToUpdate]);

  function handleDepartmentChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(departmentId) : value;
    setDepartmentId(next);
    if (next !== PRODUCTION_DEPARTMENT_ID) setProductionSubDepartment(null);
    if (roleId) {
      const role = roleHelpers.getRoleById(roleId);
      if (role?.departmentId !== null && role?.departmentId !== next) setRoleId(null);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (userToUpdate) {
        const dto: {
          name: string;
          gender: Gender | null;
          phone: string | null;
          email: string | null;
          isLoginEnabled: boolean;
          departmentId: string | null;
          productionSubDepartment: ProductionSubDepartment | null;
          roleId?: string;
          password?: string;
        } = {
          name,
          gender: (gender as Gender) || null,
          phone: phone || null,
          email: email || null,
          isLoginEnabled,
          departmentId,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
        };

        if (showPasswordField && password) dto.password = password;
        if (!isAdminUser && roleId) dto.roleId = roleId;

        return await usersApi.update({ privateRequest, id: userToUpdate.id, dto });
      }

      return await usersApi.create({
        privateRequest,
        dto: {
          name,
          gender: (gender as Gender) || null,
          phone: phone || null,
          email: email || null,
          isLoginEnabled,
          departmentId,
          productionSubDepartment: (productionSubDepartment as ProductionSubDepartment) || null,
          password: showPasswordField ? password : null,
          roleId: roleId!,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      onSuccess?.();
      handleClose();
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (!name.trim()) return setValidationError(translate("Please enter the user's name.", "يرجى إدخال اسم المستخدم."));
    if (!validationRegex.name.test(name))
      return setValidationError(
        translate("The user's name contains invalid characters.", "اسم المستخدم يحتوي على أحرف غير صالحة."),
      );
    if (isLoginEnabled && !phone && !email)
      return setValidationError(
        translate("Either email or phone must be provided.", "يجب إدخال البريد الإلكتروني أو رقم الهاتف."),
      );
    if (phone && !validationRegex.globalPhone.test(phone))
      return setValidationError(translate("Please enter a valid phone number.", "يرجى إدخال رقم هاتف صالح."));
    if (email && !validationRegex.email.test(email))
      return setValidationError(translate("Please enter a valid email address.", "يرجى إدخال عنوان بريد إلكتروني صالح."));
    if (showPasswordField && !password)
      return setValidationError(translate("Please enter a password.", "يرجى إدخال كلمة المرور."));
    if (password && !validationRegex.password.test(password))
      return setValidationError(
        translate("Password must be at least 8 characters.", "يجب أن تكون كلمة المرور 8 أحرف على الأقل."),
      );
    if (!departmentId) return setValidationError(translate("Please select a department.", "يرجى اختيار قسم."));
    if (!isAdminUser && !roleId) return setValidationError(translate("Please select a role.", "يرجى اختيار دور."));
    if (isProductionDepartment && !productionSubDepartment)
      return setValidationError(
        translate(
          "Production department is required when the department is Production.",
          "قسم الانتاج مطلوب عندما يكون القسم هو الإنتاج.",
        ),
      );

    mutation.mutate();
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setValidationError("");
      mutation.reset();
      if (isForList) {
        if (userToUpdate) setUserToUpdate(null);
        else reset();
      }
    }, 250);
  }

  const title = translate(`${userToUpdate ? "Edit" : "Add"} User`, `${userToUpdate ? "تعديل المستخدم" : "إضافة مستخدم"}`);

  const isRequiredInputFilled =
    !!name &&
    (!isLoginEnabled || !!phone || !!email) &&
    (!showPasswordField || !!password) &&
    !!departmentId &&
    (isAdminUser || !!roleId) &&
    (!isProductionDepartment || !!productionSubDepartment);

  const isDataChanged = userToUpdate
    ? name !== userToUpdate.name ||
      (gender || null) !== userToUpdate.gender ||
      (phone || null) !== userToUpdate.phone ||
      (email || null) !== userToUpdate.email ||
      isLoginEnabled !== userToUpdate.isLoginEnabled ||
      (changePassword && !!password) ||
      roleId !== userToUpdate.roleId ||
      departmentId !== userToUpdate.departmentId ||
      productionSubDepartment !== userToUpdate.productionSubDepartment
    : false;

  const isReadyToSubmit = isRequiredInputFilled && (userToUpdate ? isDataChanged : true);

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          label={translate("Name", "الاسم")}
          placeholder={translate("Enter user name", "أدخل اسم المستخدم")}
          required
          autoFocus
          radius="md"
        />

        <SelectGender
          value={gender}
          setValue={setGender}
          label={translate("Gender", "النوع")}
          placeholder={translate("Select gender", "اختر النوع")}
          clearable
        />

        <SelectDepartment
          value={departmentId}
          setValue={handleDepartmentChange}
          label={translate("Department", "القسم")}
          placeholder={translate("Select department", "اختر القسم")}
          searchable
          required
        />

        {isProductionDepartment && (
          <SelectProductionSubDepartment
            value={productionSubDepartment}
            setValue={setProductionSubDepartment}
            label={translate("Production Department", "قسم الانتاج")}
            placeholder={translate("Select department", "اختر القسم")}
            searchable
            required
          />
        )}

        {!isAdminUser && (
          <SelectRole
            value={roleId}
            setValue={setRoleId}
            departmentId={departmentId}
            label={translate("Role", "الدور")}
            placeholder={translate("Select role", "اختر الدور")}
            searchable
            required
          />
        )}

        <Checkbox
          checked={isLoginEnabled}
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            setIsLoginEnabled(checked);
            if (!checked) {
              setPassword("");
              setChangePassword(false);
            }
          }}
          label={translate("Can log in and use the system", "يمكنه تسجيل الدخول واستخدام النظام")}
          radius="sm"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            label={translate("Phone", "الهاتف")}
            description={
              isLoginEnabled
                ? translate("Required if email is empty", "مطلوب إذا كان البريد فارغًا")
                : undefined
            }
            placeholder={translate("Enter phone", "أدخل الهاتف")}
            autoComplete="off"
            radius="md"
          />

          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label={translate("Email", "البريد الإلكتروني")}
            description={
              isLoginEnabled
                ? translate("Required if phone is empty", "مطلوب إذا كان الهاتف فارغًا")
                : undefined
            }
            placeholder={translate("Enter email", "أدخل البريد الإلكتروني")}
            autoComplete="off"
            radius="md"
          />
        </div>

        {userToUpdate && isLoginEnabled && (
          <Checkbox
            checked={changePassword}
            onChange={(e) => {
              const checked = e.currentTarget.checked;
              setChangePassword(checked);
              if (!checked) setPassword("");
            }}
            label={translate("Change password", "تغيير كلمة المرور")}
            radius="sm"
          />
        )}

        {showPasswordField && (
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            label={translate("Password", "كلمة المرور")}
            description={
              userToUpdate
                ? translate("Enter a new password for this user", "أدخل كلمة مرور جديدة لهذا المستخدم")
                : translate("Enter a password with at least 8 characters", "أدخل كلمة مرور بأقل 8 أحرف")
            }
            placeholder={translate("Enter password", "أدخل كلمة المرور")}
            autoComplete="new-password"
            radius="md"
            required
          />
        )}

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
