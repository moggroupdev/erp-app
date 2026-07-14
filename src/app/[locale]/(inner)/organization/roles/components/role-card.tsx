import Link from "next/link";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import { type Role } from "@/types/roles";
import { Badge, Tooltip } from "@mantine/core";
import { Building2, Shield } from "lucide-react";

export default function RoleCard({ role, departmentName }: { role: Role; departmentName?: string | null }) {
  const { translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  return (
    <Link
      href={getLocalizedHref(`/organization/roles/${role.id}`)}
      className="group flex h-full flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <Shield size={22} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-lg leading-6 font-semibold text-gray-800">{role.name}</h3>

            {departmentName ? (
              <Tooltip withArrow label={translate("Department", "القسم")}>
                <Badge variant="light" color="violet" radius="md" leftSection={<Building2 size={12} />}>
                  {departmentName}
                </Badge>
              </Tooltip>
            ) : (
              <Badge variant="light" color="gray" radius="md">
                {translate("No department", "ليس مرتبط بأي قسم")}
              </Badge>
            )}
          </div>

          {role.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{role.description}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">{translate("No description", "لا يوجد وصف")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
