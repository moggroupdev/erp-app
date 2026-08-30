import PermissionGuard from "@/components/guards/permission";
import { PERMISSIONS } from "@/lib/constants/enums/permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission={PERMISSIONS.ADD_MATERIAL_PURCHASE_REQUISITION} isForPage>
      {children}
    </PermissionGuard>
  );
}
