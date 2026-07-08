import AdminSidebar from "@/components/global/admin-sidabar";
import { ADMIN_SIDEBAR_WIDTH } from "@/lib/constants/global";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="block h-full">
      <div className="flex min-h-full flex-row">
        <AdminSidebar width={ADMIN_SIDEBAR_WIDTH} />
        <div className="flex-1 overflow-hidden bg-gray-100 p-6">{children}</div>
      </div>
    </div>
  );
}
