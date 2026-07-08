import { useUser } from "@/contexts/user/hook";
import type { Permission } from "@/lib/constants/enums/permissions";

export default function useHasPermission(permission: Permission): boolean {
  const { isInitializing, user } = useUser();

  if (isInitializing) return false;

  if (!user) return false;

  if (user.isAdmin) return true;

  return user.role.permissions.includes(permission);
}
