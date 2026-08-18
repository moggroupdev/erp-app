"use client";

import useUser from "@/contexts/user/hook";
import { DEFAULT_HOME_HREF } from "@/lib/constants/global";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { Button } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

export default function NotFound({ dashboard }: { dashboard?: boolean }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { user } = useUser();
  const homeHref = getLocalizedHref(user ? user.role?.homeUrl || DEFAULT_HOME_HREF : dashboard ? DEFAULT_HOME_HREF : "/");

  return (
    <div className="flex-center h-full flex-1 flex-col gap-5 p-4 pb-20">
      <Image src={"/images/no-content.png"} alt="404" width={112} height={112} loading="eager" />
      <h1 className="text-3xl">{translate("Page not found", "الصفحة غير موجودة")}</h1>
      <p>{translate("The page you're looking for doesn't exist.", "الصفحة التي تبحث عنها غير موجودة.")}</p>
      <Link href={homeHref}>
        <Button variant="light" radius="md">
          {translate("Home", "الصفحة الرئيسية")}
        </Button>
      </Link>
    </div>
  );
}
