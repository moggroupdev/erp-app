"use client";

import type { ReactNode } from "react";
import { Badge, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { BriefcaseBusiness, Building2, CalendarDays, Factory, KeyRound, Mail, Phone, Shield, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import useUser from "@/contexts/user/hook";
import useDepartments from "@/hooks/reference/use-departments";
import { formatDateAndTime } from "@/lib/helpers/date-formaters";
import { PRODUCTION_DEPARTMENT_ID } from "@/lib/constants/global";
import { getGenderLabel } from "@/lib/constants/enums/genders";
import { getProductionSubDepartmentLabel } from "@/lib/constants/enums/production-sub-departments";
import LayoutBox from "@/components/ui/layout-box";
import LoadingSection from "@/components/ui/sections/loading";
import CopyButton from "@/components/ui/copy-button";
import { EmptyValue } from "@/components/ui/entity-details";
import ChangePasswordModal from "./change-password-modal";

const PAGE_TITLE = { en: "Profile", ar: "الملف الشخصي" };

function InfoRow({ icon: Icon, label, children }: { icon: typeof Building2; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-gray-900 sm:text-[15px]">{children}</div>
      </div>
    </div>
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
  const isProductionDepartment = user?.departmentId === PRODUCTION_DEPARTMENT_ID;
  const headlineMeta = [user?.jobTitle, departmentLabel].filter(Boolean).join(" · ");

  return (
    <LayoutBox
      header={{
        title: translate(PAGE_TITLE.en, PAGE_TITLE.ar),
        subTitle: translate(
          "Your personal and organizational details for reference. You can update your password here; other fields are managed by administrators.",
          "بياناتك الشخصية والتنظيمية للمرجعية. يمكنك تحديث كلمة المرور من هنا، أما بقية الحقول فيديرها المسؤولون.",
        ),
      }}
    >
      {isInitializing ? (
        <LoadingSection message={translate("Loading profile...", "جاري تحميل الملف الشخصي...")} />
      ) : (
        user && (
          <>
            <ChangePasswordModal opened={passwordModalOpened} onClose={closePasswordModal} />

            <article className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-teal-800" />

              <header className="relative border-b border-gray-200 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
                <div className="pointer-events-none absolute -end-10 -top-16 h-48 w-48 rounded-full bg-teal-50/80" />
                <div className="pointer-events-none absolute end-16 -top-8 h-28 w-28 rounded-full bg-slate-100/90" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100 sm:h-16 sm:w-16">
                      <UserRound size={28} strokeWidth={1.6} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{user.name}</h2>
                          {user.isAdmin ? (
                            <Badge size="sm" variant="light" color="dark">
                              {translate("Admin", "مسؤول")}
                            </Badge>
                          ) : roleName ? (
                            <Badge size="sm" variant="light" color="teal">
                              {roleName}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-1.5 text-sm text-gray-600 sm:text-[15px]">
                          {headlineMeta || translate("No job title", "لا توجد وظيفة")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                          {user.code}
                          <CopyButton text={user.code} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="grid lg:grid-cols-2">
                <section className="flex flex-col gap-5 border-b border-gray-200 px-5 py-6 sm:px-8 lg:border-e lg:border-b-0">
                  <h3 className="text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
                    {translate("Personal information", "المعلومات الشخصية")}
                  </h3>

                  <div className="flex flex-col gap-5">
                    <InfoRow icon={UserRound} label={translate("Gender", "النوع")}>
                      {user.gender ? getGenderLabel(user.gender, locale) : <EmptyValue />}
                    </InfoRow>
                    <InfoRow icon={Phone} label={translate("Phone", "الهاتف")}>
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className="hover:underline">
                          {user.phone}
                        </a>
                      ) : (
                        <EmptyValue />
                      )}
                    </InfoRow>
                    <InfoRow icon={Mail} label={translate("Email", "البريد الإلكتروني")}>
                      {user.email ? (
                        <a href={`mailto:${user.email}`} className="hover:underline">
                          {user.email}
                        </a>
                      ) : (
                        <EmptyValue />
                      )}
                    </InfoRow>
                  </div>
                </section>

                <section className="flex flex-col gap-5 px-5 py-6 sm:px-8">
                  <h3 className="text-[11px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
                    {translate("Organization", "المؤسسة")}
                  </h3>

                  <div className="flex flex-col gap-5">
                    <InfoRow icon={Building2} label={translate("Department", "القسم")}>
                      {departmentLabel || <EmptyValue />}
                    </InfoRow>

                    {isProductionDepartment && (
                      <InfoRow icon={Factory} label={translate("Production Department", "قسم الانتاج")}>
                        {user.productionSubDepartment ? (
                          getProductionSubDepartmentLabel(user.productionSubDepartment, locale)
                        ) : (
                          <EmptyValue />
                        )}
                      </InfoRow>
                    )}

                    <InfoRow icon={BriefcaseBusiness} label={translate("Job Title", "الوظيفة")}>
                      {user.jobTitle || <EmptyValue />}
                    </InfoRow>

                    <InfoRow icon={Shield} label={translate("Role", "الدور")}>
                      {user.isAdmin ? (
                        <Badge size="sm" variant="light" color="dark">
                          {translate("Admin", "مسؤول")}
                        </Badge>
                      ) : (
                        roleName || <EmptyValue />
                      )}
                    </InfoRow>

                    <InfoRow icon={CalendarDays} label={translate("Account created", "تاريخ إنشاء الحساب")}>
                      {formatDateAndTime(user.createdAt, locale)}
                    </InfoRow>
                  </div>
                </section>
              </div>

              <footer className="flex flex-col gap-4 border-t border-gray-200 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-800 ring-1 ring-gray-200">
                    <KeyRound size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {translate("Password & security", "كلمة المرور والأمان")}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {translate(
                        "Only your password can be changed from here. Keep it private and update it when needed.",
                        "يمكن تغيير كلمة المرور فقط من هنا. احتفظ بها خاصة وحدّثها عند الحاجة.",
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={openPasswordModal}
                  variant="light"
                  color="blue"
                  size="xs"
                  radius="md"
                  leftSection={<KeyRound size={15} />}
                  className="self-start sm:self-auto"
                >
                  {translate("Update password", "تحديث كلمة المرور")}
                </Button>
              </footer>
            </article>
          </>
        )
      )}
    </LayoutBox>
  );
}
