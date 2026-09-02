import PermissionGuard from "@/components/guards/permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission={PERMISSIONS.USE_UNIT_CONVERSION_TOOL} isForPage>
      {children}
    </PermissionGuard>
  );
}
