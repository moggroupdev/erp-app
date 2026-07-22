"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import usePrivateRequest from "@/hooks/use-private-request";
import rolesApi from "@/lib/api/roles";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { queryKeys } from "@/lib/api/query-keys";
import { SALES_DEPARTMENT_ID, BASE_URL } from "@/lib/constants/global";
import {
  PERMISSION_DOMAIN_GROUPS,
  PERMISSION_LABELS,
  PERMISSION_LABELS_LIST,
  type Permission,
} from "@/lib/constants/enums/permissions";
import { type CreateRoleDto } from "@/types/roles";
import toAppRelativePath, { toAppHomeUrlInput } from "@/lib/helpers/to-app-relative-path";
import { Button, Checkbox, Divider, NumberInput, TextInput, Textarea } from "@mantine/core";
import ErrorAlert from "@/components/ui/error-alert";
import Modal from "@/components/ui/modal";
import SelectDepartment from "@/components/global/selections/query-based/select-department";
import { Check, Info, KeyRound, Shield, TriangleAlert, X } from "lucide-react";

type RoleFormValues = {
  name: string;
  description: string | null;
  maxDiscountPct: number | null;
  departmentId: string | null;
  homeUrl: string | null;
  permissions: Permission[];
};

export default function RoleForm({
  mode,
  roleId,
  initialValues,
}: {
  mode: "create" | "edit";
  roleId?: string;
  initialValues?: RoleFormValues;
}) {
  const { locale, translate, translation } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();

  const queryClient = useQueryClient();
  const privateRequest = usePrivateRequest();
  const [validationError, setValidationError] = useState("");

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [maxDiscountPct, setMaxDiscountPct] = useState<number | string>(initialValues?.maxDiscountPct ?? "");
  const [departmentId, setDepartmentId] = useState<string | null>(initialValues?.departmentId ?? null);
  const [homeUrl, setHomeUrl] = useState(toAppHomeUrlInput(initialValues?.homeUrl, locale));
  const [permissions, setPermissions] = useState<Permission[]>(initialValues?.permissions ?? []);

  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const isSalesDepartment = departmentId === SALES_DEPARTMENT_ID;
  const isEdit = mode === "edit";

  function handleDepartmentChange(value: React.SetStateAction<string | null>) {
    const next = typeof value === "function" ? value(departmentId) : value;
    setDepartmentId(next);
    if (next !== SALES_DEPARTMENT_ID) setMaxDiscountPct("");
  }

  function buildDto(): CreateRoleDto {
    const relativeHomeUrl = toAppRelativePath(homeUrl);
    if (!relativeHomeUrl) throw new Error("Home page path is invalid.");

    return {
      name: name.trim(),
      description: description.trim() || null,
      maxDiscountPct: isSalesDepartment && maxDiscountPct !== "" ? Number(maxDiscountPct) : null,
      departmentId,
      homeUrl: relativeHomeUrl,
      permissions,
    };
  }

  function permissionsEqual(a: Permission[], b: Permission[]) {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((permission) => set.has(permission));
  }

  function hasChanges() {
    if (!isEdit || !initialValues) return true;

    const relativeHomeUrl = toAppRelativePath(homeUrl);
    const initialHomeUrl = initialValues.homeUrl?.trim() ?? "";

    return (
      name.trim() !== initialValues.name.trim() ||
      (description.trim() || null) !== (initialValues.description?.trim() || null) ||
      (isSalesDepartment && maxDiscountPct !== "" ? Number(maxDiscountPct) : null) !== initialValues.maxDiscountPct ||
      departmentId !== initialValues.departmentId ||
      relativeHomeUrl !== initialHomeUrl ||
      !permissionsEqual(permissions, initialValues.permissions)
    );
  }

  const isDirty = hasChanges();

  const mutation = useMutation({
    mutationFn: async () => {
      const dto = buildDto();
      if (isEdit)
        if (!roleId) throw new Error("Role ID is required for update.");
        else return await rolesApi.update({ privateRequest, id: roleId, dto });
      return await rolesApi.create({ privateRequest, dto });
    },
    onSuccess: async (response) => {
      closeConfirm();
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      router.push(getLocalizedHref(`/organization/roles/${response.id}`));
    },
  });

  const error = validationError || (mutation.error ? getErrorMessage(locale, mutation.error) : "");

  function validate(): boolean {
    setValidationError("");

    if (!name.trim()) {
      setValidationError(translate("Please enter the role name.", "يرجى إدخال اسم الدور."));
      return false;
    }

    if (!departmentId) {
      setValidationError(translate("Please select a department.", "يرجى اختيار قسم."));
      return false;
    }

    if (isSalesDepartment && maxDiscountPct !== "" && (Number(maxDiscountPct) < 0 || Number(maxDiscountPct) > 100)) {
      setValidationError(translate("Max discount must be between 0 and 100.", "يجب أن يكون أقصى خصم بين 0 و 100."));
      return false;
    }

    if (!homeUrl.trim()) {
      setValidationError(translate("Please enter the home page URL.", "يرجى إدخال رابط الصفحة الرئيسية."));
      return false;
    }

    if (!toAppRelativePath(homeUrl)) {
      setValidationError(
        translate(
          "Enter a full app link or a relative path (e.g. https://app.moggroup.net/ar/dashboard) in the home page URL field.",
          "أدخل رابطًا كاملًا للتطبيق أو مسارًا نسبيًا (مثال: https://app.moggroup.net/ar/dashboard) في حقل رابط الصفحة الرئيسية.",
        ),
      );
      return false;
    }

    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      if (!isDirty) return;
      openConfirm();
      return;
    }

    mutation.mutate();
  }

  function handleConfirmSave() {
    mutation.mutate();
  }

  function toggleDomainPermissions(domainPermissions: Permission[]) {
    const allDomainSelected = domainPermissions.every((p) => permissions.includes(p));
    if (allDomainSelected) setPermissions(permissions.filter((p) => !domainPermissions.includes(p)));
    else setPermissions([...new Set([...permissions, ...domainPermissions])]);
  }

  const cancelHref = isEdit && roleId ? `/organization/roles/${roleId}` : "/organization/roles";

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 md:p-6">
              <header className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {translate("Basic information", "المعلومات الأساسية")}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {translate(
                      "Give the role a clear name and optional description so others know what it is for.",
                      "أعطِ الدور اسمًا واضحًا ووصفًا اختياريًا ليتعرف الآخرون على الغرض منه.",
                    )}
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  label={translate("Role Name", "اسم الدور")}
                  description={translate(
                    "Used across the organization to identify this access level.",
                    "يُستخدم عبر المؤسسة للتعرّف على مستوى الوصول هذا.",
                  )}
                  placeholder={translate("e.g. Purchasing Manager, Inventory Clerk", "مثال: مدير المشتريات، موظف المخزن")}
                  required
                  autoFocus={!isEdit}
                  radius="md"
                  className="sm:col-span-2"
                />

                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                  label={translate("Description (Optional)", "الوصف (اختياري)")}
                  description={translate(
                    "A short note about who should get this role and what they do.",
                    "ملاحظة قصيرة عمّن يجب أن يحصل على هذا الدور وما يقوم به.",
                  )}
                  placeholder={translate("Enter a short description", "أدخل وصفًا مختصرًا")}
                  radius="md"
                  minRows={3}
                  className="sm:col-span-2"
                />

                <TextInput
                  value={homeUrl}
                  onChange={(e) => setHomeUrl(e.currentTarget.value)}
                  label={translate("Home Page", "الصفحة الرئيسية")}
                  description={translate(
                    "The page users with this role open after signing in. You can paste a full link from the address bar.",
                    "الصفحة التي يفتحها المستخدمون بهذا الدور بعد تسجيل الدخول. يمكنك لصق الرابط الكامل من شريط العنوان.",
                  )}
                  placeholder={`${BASE_URL}/${locale}/dashboard`}
                  required
                  radius="md"
                  className="sm:col-span-2"
                />
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 md:p-6">
              <header className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-white text-violet-600">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{translate("Department", "القسم")}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {translate(
                      "Link the role to a department. Sales roles can also set a negotiation discount ceiling.",
                      "اربط الدور بقسم. أدوار المبيعات يمكنها أيضًا تحديد سقف خصم التفاوض.",
                    )}
                  </p>
                </div>
              </header>

              <SelectDepartment
                value={departmentId}
                setValue={handleDepartmentChange}
                label={translate("Department", "القسم")}
                description={translate("Associates this role with a specific team.", "يربط هذا الدور بفريق معيّن.")}
                placeholder={translate("Select department", "اختر القسم")}
                searchable
                required
              />

              {isSalesDepartment && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                  <NumberInput
                    value={maxDiscountPct}
                    onChange={setMaxDiscountPct}
                    label={translate("Max Discount % (Optional)", "أقصى خصم ٪ (اختياري)")}
                    description={translate(
                      "The highest discount percentage users with this role may apply when negotiating an offer. Must be between 0 and 100.",
                      "أعلى نسبة خصم يمكن للمستخدمين بهذا الدور تطبيقها عند التفاوض على عرض. يجب أن تكون بين 0 و 100.",
                    )}
                    placeholder="0 – 100"
                    min={0}
                    max={100}
                    clampBehavior="strict"
                    allowNegative={false}
                    decimalScale={2}
                    radius="md"
                    suffix=" %"
                  />
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-teal-800">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    {translate(
                      "Applies only to Sales. During offer negotiation, company-side discounts cannot exceed this limit.",
                      "ينطبق على المبيعات فقط. أثناء تفاوض العرض، لا يمكن أن يتجاوز خصم الشركة هذا الحد.",
                    )}
                  </p>
                </div>
              )}
            </section>
          </div>

          <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 md:p-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{translate("Permissions", "الصلاحيات")}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {translate(
                      "Choose what users with this role can see and do in the system. You can change these later.",
                      "اختر ما يمكن للمستخدمين بهذا الدور رؤيته وفعله في النظام. يمكنك تغييرها لاحقًا.",
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-1 text-sm font-medium text-gray-600">
                {translate(
                  `${permissions.length} of ${PERMISSION_LABELS_LIST.length} selected`,
                  `${permissions.length} من ${PERMISSION_LABELS_LIST.length} محددة`,
                )}
              </p>
            </header>

            <Checkbox.Group value={permissions} onChange={(value) => setPermissions(value as Permission[])}>
              <div className="flex flex-col gap-4">
                {PERMISSION_DOMAIN_GROUPS.map((group) => {
                  const selectedInDomain = group.permissions.filter((p) => permissions.includes(p)).length;
                  const allDomainSelected = selectedInDomain === group.permissions.length;

                  return (
                    <div key={group.domain} className="flex flex-col gap-2 rounded-2xl bg-slate-50/75 p-4">
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-800">
                            {translate(group.label.en, group.label.ar)}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              allDomainSelected
                                ? "bg-indigo-100 text-indigo-700"
                                : selectedInDomain > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {selectedInDomain}/{group.permissions.length}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="light"
                          color={allDomainSelected ? "red" : "indigo"}
                          radius="xl"
                          size="xs"
                          leftSection={allDomainSelected ? <X size={13} /> : <Check size={13} />}
                          onClick={() => toggleDomainPermissions(group.permissions)}
                        >
                          {allDomainSelected
                            ? translate("Clear Group", "مسح المجموعة")
                            : translate("Select Group", "تحديد المجموعة")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <Checkbox
                            key={permission}
                            value={permission}
                            label={translate(PERMISSION_LABELS[permission].label.en, PERMISSION_LABELS[permission].label.ar)}
                            radius="sm"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Checkbox.Group>
          </section>
        </div>

        <Divider variant="dashed" />

        {error && !confirmOpened && <ErrorAlert error={error} />}

        <div className="flex flex-col gap-3 md:flex-row md:justify-between">
          <p className="text-sm text-gray-500">
            {isEdit
              ? translate(
                  "Saving changes will update access immediately for every user assigned to this role.",
                  "حفظ التغييرات سيحدّث صلاحيات الوصول فورًا لكل المستخدمين المعيّنين لهذا الدور.",
                )
              : translate(
                  "After creating, you can review the role and assign it to users.",
                  "بعد الإنشاء، يمكنك مراجعة الدور وتعيينه للمستخدمين.",
                )}
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              type="button"
              variant="light"
              color="dark"
              radius="md"
              onClick={() => router.push(getLocalizedHref(cancelHref))}
              disabled={mutation.isPending}
            >
              {translation.cancel}
            </Button>
            <Button
              type="submit"
              loading={!isEdit && mutation.isPending}
              disabled={isEdit && (!name.trim() || !departmentId || !homeUrl.trim() || !isDirty)}
              radius="md"
            >
              {isEdit ? translate("Save Changes", "حفظ التغييرات") : translate("Create Role", "إنشاء الدور")}
            </Button>
          </div>
        </div>
      </form>

      <Modal opened={confirmOpened} onClose={closeConfirm} title={translate("Confirm role update", "تأكيد تحديث الدور")}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-900">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm">
              {translate(
                "All users assigned to this role will be affected immediately by these changes. Continue?",
                "سيتأثر جميع المستخدمين المعيّنين لهذا الدور فورًا بهذه التغييرات. هل تريد المتابعة؟",
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="light" color="dark" radius="md" onClick={closeConfirm} disabled={mutation.isPending} fullWidth>
              {translation.cancel}
            </Button>
            <Button radius="md" loading={mutation.isPending} onClick={handleConfirmSave} fullWidth>
              {translate("Confirm & Save", "تأكيد وحفظ")}
            </Button>
          </div>

          {error && <ErrorAlert error={error} />}
        </div>
      </Modal>
    </>
  );
}
