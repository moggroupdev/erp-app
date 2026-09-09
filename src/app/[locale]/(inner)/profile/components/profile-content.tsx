"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Badge, Button, Divider, PasswordInput } from "@mantine/core";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import usePrivateRequest from "@/hooks/use-private-request";
import useDepartments from "@/hooks/reference/use-departments";
import useRoles from "@/hooks/reference/use-roles";
import profileApi from "@/lib/api/profile";
import getErrorMessage from "@/lib/helpers/get-error-message";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { queryKeys } from "@/lib/api/query-keys";
import { staleTimes } from "@/lib/constants/stale-times";
import { validationRegex } from "@/lib/constants/regex";
import { getGenderLabel } from "@/lib/constants/enums/genders";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import LayoutBox from "@/components/ui/layout-box";
import RefetchButton from "@/components/ui/refetch-button";
import LoadingSection from "@/components/ui/sections/loading";
import ErrorSection from "@/components/ui/sections/error";
import ErrorAlert from "@/components/ui/error-alert";
import CopyButton from "@/components/ui/copy-button";
import { CreatorLink, DetailsTable, EmptyValue, type DetailRow } from "@/components/ui/entity-details";

const PAGE_TITLE = { en: "Profile", ar: "الملف الشخصي" };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileContent() {
  const { locale, translate } = useI18n();
  const privateRequest = usePrivateRequest();
  const { helpers: departmentHelpers } = useDepartments();
  const { helpers: roleHelpers } = useRoles();

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: ({ signal }) => profileApi.get({ privateRequest, signal }),
    staleTime: staleTimes.profile,
  });

  const user = profileQuery.data || null;
  const loading = profileQuery.isFetching;
  const errorMessage = profileQuery.error ? getErrorMessage(locale, profileQuery.error) : "";

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar));

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () =>
      profileApi.updatePassword({
        privateRequest,
        dto: { currentPassword, newPassword },
      }),
    onSuccess: (response) => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setValidationError("");
      setSuccessMessage(response.message || translate("Password updated successfully.", "تم تحديث كلمة المرور بنجاح."));
    },
  });

  const mutationError = passwordMutation.error ? getErrorMessage(locale, passwordMutation.error) : "";

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setValidationError("");
    passwordMutation.reset();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError(translate("Please fill in all password fields.", "يرجى تعبئة جميع حقول كلمة المرور."));
      return;
    }
    if (!validationRegex.password.test(newPassword)) {
      setValidationError(translate("Password must be at least 8 characters.", "يجب أن تكون كلمة المرور 8 أحرف على الأقل."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError(
        translate("New password and confirmation do not match.", "كلمة المرور الجديدة وتأكيدها غير متطابقين."),
      );
      return;
    }
    if (newPassword === currentPassword) {
      setValidationError(
        translate(
          "New password must be different from the current password.",
          "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية.",
        ),
      );
      return;
    }

    passwordMutation.mutate();
  }

  const department = user ? departmentHelpers.getDepartmentById(user.departmentId) : null;
  const role = user ? roleHelpers.getRoleById(user.roleId) : null;

  const rows: DetailRow[] = user
    ? [
        {
          key: translate("Job Title", "الوظيفة"),
          value: user.jobTitle || <EmptyValue />,
        },
        {
          key: translate("Gender", "النوع"),
          value: user.gender ? getGenderLabel(user.gender, locale) : <EmptyValue />,
        },
        {
          key: translate("Phone", "الهاتف"),
          value: user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : <EmptyValue />,
        },
        {
          key: translate("Email", "البريد الإلكتروني"),
          value: user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : <EmptyValue />,
        },
        {
          key: translate("Department", "القسم"),
          value: department ? translate(department.nameEn, department.nameAr) : <EmptyValue />,
        },
        {
          key: translate("Production Department", "قسم الانتاج"),
          value: user.productionSubDepartment ? (
            getProductionSubDepartmentLabel(user.productionSubDepartment, locale)
          ) : (
            <EmptyValue />
          ),
        },
        {
          key: translate("Role", "الدور"),
          value: (
            <div className="flex flex-wrap items-center gap-2">
              {user.isLoginEnabled && !user.isAdmin && (role ? role.name : <EmptyValue />)}
              {user.isAdmin && (
                <Badge size="sm" variant="light" color="dark">
                  {translate("Admin", "مسؤول")}
                </Badge>
              )}
            </div>
          ),
        },
        {
          key: translate("Created By", "أنشئ بواسطة"),
          value: <CreatorLink creator={user.createdBy} />,
        },
        {
          key: translate("Created At", "تاريخ الإنشاء"),
          value: formatDateAndTime(user.createdAt, locale),
        },
      ]
    : [];

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate("View your account details and update your password.", "عرض بيانات حسابك وتحديث كلمة المرور."),
        sideElements: <RefetchButton isFetching={loading} onRefetch={() => profileQuery.refetch()} />,
      }}
    >
      {loading ? (
        <LoadingSection message={translate("Loading profile...", "جاري تحميل الملف الشخصي...")} />
      ) : errorMessage ? (
        <ErrorSection
          errorTitle={translate("An error occurred while loading your profile", "حدث خطأ أثناء تحميل ملفك الشخصي")}
          errorMessage={errorMessage}
          button={{ text: translate("Retry", "إعادة المحاولة"), onClick: () => profileQuery.refetch() }}
        />
      ) : (
        user && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)]">
            <section className="flex flex-col gap-4 rounded-xl">
              <Divider variant="dashed" />

              <header
                className={`relative overflow-hidden border border-gray-200/80 bg-linear-to-br from-slate-50 via-white to-teal-50/30 p-5 sm:p-6 ${translate("rounded-r-3xl", "rounded-l-3xl")}`}
              >
                <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-teal-500" />

                <div className="flex flex-col gap-4 ps-2 sm:flex-row sm:items-center sm:justify-between sm:ps-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-base font-semibold tracking-wide text-white ring-1 ring-teal-500 sm:h-16 sm:w-16 sm:text-lg">
                      {getInitials(user.name)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">{user.name}</h2>
                        {user.isAdmin && (
                          <Badge size="sm" variant="light" color="dark">
                            {translate("Admin", "مسؤول")}
                          </Badge>
                        )}
                        {!user.isAdmin && role && (
                          <Badge size="sm" variant="light" color="teal">
                            {role.name}
                          </Badge>
                        )}
                      </div>

                      {user.jobTitle && <p className="text-sm text-gray-500 sm:text-base">{user.jobTitle}</p>}

                      <div className="flex items-center gap-1.5 font-mono text-sm text-gray-500">
                        <span>{user.code}</span>
                        <CopyButton text={user.code} />
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <Divider variant="dashed" />

              <DetailsTable rows={rows} />
            </section>

            <section className="flex h-fit flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-5 sm:p-6">
              <header className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 ring-1 ring-teal-100">
                  <KeyRound size={20} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {translate("Change password", "تغيير كلمة المرور")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {translate(
                      "Use a strong password with at least 8 characters.",
                      "استخدم كلمة مرور قوية من 8 أحرف على الأقل.",
                    )}
                  </p>
                </div>
              </header>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.currentTarget.value);
                    setSuccessMessage("");
                  }}
                  label={translate("Current password", "كلمة المرور الحالية")}
                  placeholder={translate("Enter current password", "أدخل كلمة المرور الحالية")}
                  autoComplete="current-password"
                  radius="md"
                  required
                />

                <PasswordInput
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.currentTarget.value);
                    setSuccessMessage("");
                  }}
                  label={translate("New password", "كلمة المرور الجديدة")}
                  description={translate("Enter a password with at least 8 characters", "أدخل كلمة مرور بأقل 8 أحرف")}
                  placeholder={translate("Enter new password", "أدخل كلمة المرور الجديدة")}
                  autoComplete="new-password"
                  radius="md"
                  required
                />

                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.currentTarget.value);
                    setSuccessMessage("");
                  }}
                  label={translate("Confirm new password", "تأكيد كلمة المرور الجديدة")}
                  placeholder={translate("Re-enter new password", "أعد إدخال كلمة المرور الجديدة")}
                  autoComplete="new-password"
                  radius="md"
                  required
                />

                <Button
                  type="submit"
                  radius="md"
                  color="teal"
                  loading={passwordMutation.isPending}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  {translate("Update password", "تحديث كلمة المرور")}
                </Button>

                {(validationError || mutationError) && <ErrorAlert error={validationError || mutationError} fade />}

                {successMessage && (
                  <Alert color="teal" icon={<CheckCircle2 size={16} />} radius="md" className="animate-fade-in">
                    {successMessage}
                  </Alert>
                )}
              </form>
            </section>
          </div>
        )
      )}
    </LayoutBox>
  );
}
