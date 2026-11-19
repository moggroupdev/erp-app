import PermissionGuard from "@/components/guards/permission";
import { ACCOUNTING_REPORT_PERMISSIONS } from "@/lib/constants/enums/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission={ACCOUNTING_REPORT_PERMISSIONS} isForPage>
      {children}
    </PermissionGuard>
  );
}
