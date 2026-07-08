import AuthenticationGuard from "@/components/guards/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthenticationGuard access="guest">{children}</AuthenticationGuard>;
}
