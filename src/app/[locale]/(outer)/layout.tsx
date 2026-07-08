import AuthenticationGuard from "@/components/guards/auth";
import HomeLayout from "@/components/layouts/home-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationGuard access="guest">
      <HomeLayout>{children}</HomeLayout>
    </AuthenticationGuard>
  );
}
