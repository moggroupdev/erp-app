import { useUser } from "@/contexts/user/hook";
import type { Permission } from "@/lib/constants/enums/permissions";

export default function useHasPermission(permission: Permission | readonly Permission[]): boolean {
  const { isInitializing, user } = useUser();

  if (isInitializing) return false;

  if (!user) return false;

  if (user.isAdmin) return true;

  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((p) => user.role.permissions.includes(p));
}
