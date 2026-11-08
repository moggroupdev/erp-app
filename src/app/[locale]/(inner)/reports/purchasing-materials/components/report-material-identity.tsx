"use client";

import CopyButton from "@/components/ui/copy-button";
import ProtectedLink from "@/components/ui/protected-link";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";
import { useI18n } from "@/lib/i18n/hooks";

export default function ReportMaterialIdentity({ title, code, hint }: { title: string; code: string; hint: string }) {
  const { translate } = useI18n();

  return (
    <div className="min-w-0">
      <ProtectedLink
        permission={PERMISSIONS.READ_MATERIALS}
        href={`/warehouse/materials/${code}`}
        className="block truncate text-base font-semibold text-gray-900 hover:underline"
      >
        {title}
      </ProtectedLink>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">{translate("Code", "الكود")}</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 font-mono text-sm font-medium text-gray-800">
          {code}
          <CopyButton text={code} />
        </span>
      </div>

      <p className="mt-2.5 text-xs leading-[1.75] text-gray-500">{hint}</p>
    </div>
  );
}
