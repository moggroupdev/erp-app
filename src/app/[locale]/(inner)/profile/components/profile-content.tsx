"use client";

import { Badge, Button, Divider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { KeyRound } from "lucide-react";
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
import { DetailsTable, EmptyValue, type DetailRow } from "@/components/ui/entity-details";
import ChangePasswordModal from "./change-password-modal";

const PAGE_TITLE = { en: "Profile", ar: "الملف الشخصي" };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileContent() {
  const { locale, translate } = useI18n();
  const { user, isInitializing } = useUser();
  const { helpers: departmentHelpers } = useDepartments();

  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);

  useDocumentTitle(translate(PAGE_TITLE.en, PAGE_TITLE.ar));

  const department = user ? departmentHelpers.getDepartmentById(user.departmentId) : null;
  const roleName = user?.role?.name ?? null;

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
              {user.isLoginEnabled && !user.isAdmin && (roleName || <EmptyValue />)}
              {user.isAdmin && (
                <Badge size="sm" variant="light" color="dark">
                  {translate("Admin", "مسؤول")}
                </Badge>
              )}
            </div>
          ),
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
        subTitle: translate(
          "View your account details and update your password.",
          "عرض بيانات حسابك وتحديث كلمة المرور.",
        ),
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
                        {!user.isAdmin && roleName && (
                          <Badge size="sm" variant="light" color="teal">
                            {roleName}
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
          </>
        )
      )}
    </LayoutBox>
  );
}
