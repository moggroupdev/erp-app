"use client";

import type { ReactNode } from "react";
import { Badge, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Factory,
  KeyRound,
  Mail,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useUser from "@/contexts/user/hook";
import useDepartments from "@/hooks/reference/use-departments";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { getGenderLabel } from "@/lib/constants/enums/genders";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import CopyButton from "@/components/ui/copy-button";
import { EmptyValue } from "@/components/ui/entity-details";
import ChangePasswordModal from "./change-password-modal";

const PAGE_TITLE = { en: "Profile", ar: "الملف الشخصي" };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfileField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl px-1 py-2.5 sm:px-2">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</div>
        <div className="mt-1 text-sm font-medium wrap-break-word text-gray-900">{children}</div>
      </div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
      <h3 className="mb-2 px-1 text-sm font-semibold text-gray-800 sm:px-2">{title}</h3>
      <div className="divide-y divide-gray-200/70">{children}</div>
    </section>
  );
}

export default function ProfileContent() {
  const { locale, translate } = useI18n();
  const { user, isInitializing } = useUser();
  const { helpers: departmentHelpers } = useDepartments();

  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar));

  const department = user ? departmentHelpers.getDepartmentById(user.departmentId) : null;
  const roleName = user?.role?.name ?? null;
  const departmentLabel = department ? translate(department.nameEn, department.nameAr) : null;

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate("Your account details", "بيانات حسابك"),
        sideElements: user ? (
          <Button
            onClick={openPasswordModal}
            variant="light"
            color="teal"
            radius="md"
            leftSection={<KeyRound size={15} />}
          >
            {translate("Change password", "تغيير كلمة المرور")}
          </Button>
        ) : undefined,
      }}
    >
      {isInitializing ? (
        <LoadingSection message={translate("Loading profile...", "جاري تحميل الملف الشخصي...")} />
      ) : (
        user && (
          <>
            <ChangePasswordModal opened={passwordModalOpened} onClose={closePasswordModal} />

            <div className="flex flex-col gap-5">
              <header
                className={`relative overflow-hidden border border-gray-200/80 bg-linear-to-br from-slate-50 via-white to-teal-50/40 p-5 sm:p-7 ${translate("rounded-r-3xl", "rounded-l-3xl")}`}
              >
                <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-teal-500" />
                <div className="pointer-events-none absolute -end-10 -top-10 h-36 w-36 rounded-full bg-teal-100/40" />
                <div className="pointer-events-none absolute -bottom-16 end-16 h-28 w-28 rounded-full bg-slate-100/70" />

                <div className="relative flex flex-col gap-5 ps-2 sm:flex-row sm:items-center sm:justify-between sm:ps-3">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-lg font-semibold tracking-wide text-white shadow-sm ring-4 ring-teal-50 sm:h-20 sm:w-20 sm:text-xl">
                      {getInitials(user.name)}
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{user.name}</h2>
                        {user.isAdmin ? (
                          <Badge size="sm" variant="light" color="dark" leftSection={<Shield size={12} />}>
                            {translate("Admin", "مسؤول")}
                          </Badge>
                        ) : roleName ? (
                          <Badge size="sm" variant="light" color="teal">
                            {roleName}
                          </Badge>
                        ) : null}
                      </div>

                      <p className="text-sm text-gray-600 sm:text-base">
                        {user.jobTitle || translate("No job title", "لا يوجد مسمى وظيفي")}
                        {departmentLabel ? (
                          <span className="text-gray-400">
                            {" · "}
                            {departmentLabel}
                          </span>
                        ) : null}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 font-mono text-xs text-gray-600 ring-1 ring-gray-200/80">
                          {user.code}
                          <CopyButton text={user.code} />
                        </span>
                        {user.gender && (
                          <span className="inline-flex items-center rounded-lg bg-white/80 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200/80">
                            {getGenderLabel(user.gender, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ProfileSection title={translate("Contact", "التواصل")}>
                  <ProfileField icon={Phone} label={translate("Phone", "الهاتف")}>
                    {user.phone ? (
                      <a href={`tel:${user.phone}`} className="text-teal-700 hover:underline">
                        {user.phone}
                      </a>
                    ) : (
                      <EmptyValue />
                    )}
                  </ProfileField>
                  <ProfileField icon={Mail} label={translate("Email", "البريد الإلكتروني")}>
                    {user.email ? (
                      <a href={`mailto:${user.email}`} className="text-teal-700 hover:underline">
                        {user.email}
                      </a>
                    ) : (
                      <EmptyValue />
                    )}
                  </ProfileField>
                  <ProfileField icon={UserRound} label={translate("Gender", "النوع")}>
                    {user.gender ? getGenderLabel(user.gender, locale) : <EmptyValue />}
                  </ProfileField>
                </ProfileSection>

                <ProfileSection title={translate("Organization", "المؤسسة")}>
                  <ProfileField icon={BriefcaseBusiness} label={translate("Job Title", "المسمى الوظيفي")}>
                    {user.jobTitle || <EmptyValue />}
                  </ProfileField>
                  <ProfileField icon={Building2} label={translate("Department", "القسم")}>
                    {departmentLabel || <EmptyValue />}
                  </ProfileField>
                  <ProfileField icon={Factory} label={translate("Production Department", "قسم الانتاج")}>
                    {user.productionSubDepartment ? (
                      getProductionSubDepartmentLabel(user.productionSubDepartment, locale)
                    ) : (
                      <EmptyValue />
                    )}
                  </ProfileField>
                  <ProfileField icon={Shield} label={translate("Role", "الدور")}>
                    {user.isAdmin ? (
                      <Badge size="sm" variant="light" color="dark">
                        {translate("Admin", "مسؤول")}
                      </Badge>
                    ) : (
                      roleName || <EmptyValue />
                    )}
                  </ProfileField>
                </ProfileSection>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <CalendarDays size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                      {translate("Account created", "تاريخ إنشاء الحساب")}
                    </div>
                    <div className="mt-0.5 font-medium text-gray-800">{formatDateAndTime(user.createdAt, locale)}</div>
                  </div>
                </div>

                <Button
                  onClick={openPasswordModal}
                  variant="subtle"
                  color="teal"
                  radius="md"
                  leftSection={<KeyRound size={15} />}
                  className="self-start sm:self-auto"
                >
                  {translate("Update password", "تحديث كلمة المرور")}
                </Button>
              </div>
            </div>
          </>
        )
      )}
    </LayoutBox>
  );
}
