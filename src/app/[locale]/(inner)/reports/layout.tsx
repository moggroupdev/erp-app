import PermissionGuard from "@/components/guards/permission";
import { ALL_REPORT_PERMISSIONS } from "@/lib/constants/enums/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission={ALL_REPORT_PERMISSIONS} isForPage>
      {children}
    </PermissionGuard>
  );
}
