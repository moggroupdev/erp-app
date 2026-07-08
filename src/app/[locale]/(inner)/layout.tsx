import AuthenticationGuard from "@/components/guards/auth";
import InnerLayout from "@/components/layouts/inner-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticationGuard access="authenticated">
      <InnerLayout>{children}</InnerLayout>
    </AuthenticationGuard>
  );
}
