"use client";

import { useUser } from "@/contexts/user/hook";
import { Permission } from "@/lib/constants/enums/permissions";
import { DEFAULT_HOME_HREF } from "@/lib/constants/global";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { Button } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

export default function PermissionGuard({
  permission,
  isForPage,
  children,
}: {
  permission: Permission;
  isForPage?: boolean;
  children: React.ReactNode;
}) {
  const { isInitializing, user } = useUser();

  if (isInitializing) return null;

  if (!user) return prevent({ isForPage });

  if (user.isAdmin) return children; // Admins have all permissions

  if (!user.role.permissions.includes(permission)) return prevent({ isForPage });

  return children;
}

// ==================== Helpers ====================

function prevent({ isForPage }: { isForPage?: boolean }) {
  if (isForPage) return <UnauthorizedAccess />;
  return null;
}

// ==================== Components ====================

function UnauthorizedAccess() {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();
  const { user } = useUser();
  const homeHref = getLocalizedHref(user?.role?.homeUrl || DEFAULT_HOME_HREF);

  return (
    <div className="flex-center h-full flex-1 flex-col gap-3 pb-20">
      <Image src="/images/unauthorized.png" alt="Unauthorized Access" width={112} height={112} />
      <h1 className="text-center text-xl sm:text-3xl">{translate("Unauthorized Access", "دخول غير مصرح")}</h1>
      <p className="text-center">
        {translate("You don't have permission to access this page.", "ليس لديك إذن للوصول إلى هذه الصفحة.")}
      </p>
      <Link href={homeHref}>
        <Button variant="light" radius="md">{translate("Home", "الصفحة الرئيسية")}</Button>
      </Link>
    </div>
  );
}
