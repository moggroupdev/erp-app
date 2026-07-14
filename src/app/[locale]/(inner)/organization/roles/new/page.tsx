"use client";

import { useRouter } from "next/navigation";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDocumentTitle from "@/hooks/use-document-title";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import CreateRoleForm from "./components/create-role-form";

const PAGE_TITLE = { en: "Create Role", ar: "إنشاء دور" };

export default function Page() {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const router = useRouter();

  useDocumentTitle(`${translate(PAGE_TITLE.en, PAGE_TITLE.ar)} | ${translate("Roles", "الأدوار")}`);

  return (
    <div className="root-flex-1 flex h-full flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(getLocalizedHref("/organization/roles"))}
            title={translate("Back", "رجوع")}
            variant="light"
            color="dark"
            radius={20}
            p={0}
            h={40}
            w={40}
          >
            <ArrowLeft size={18} style={{ transform: `rotateY(${translate("0", "180deg")})` }} />
          </Button>
          <h1>{translate(PAGE_TITLE.en, PAGE_TITLE.ar)}</h1>
        </div>
        <p className="text-gray-500">
          {translate(
            "Set up the role details, optional department link, and the permissions users will inherit.",
            "حدّد تفاصيل الدور، وربط القسم الاختياري، والصلاحيات التي سيرثها المستخدمون.",
          )}
        </p>
      </header>

      <CreateRoleForm />
    </div>
  );
}
