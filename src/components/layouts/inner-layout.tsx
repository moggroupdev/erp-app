import InnerSidebar from "@/components/global/inner-sidabar";

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="block h-full">
      <div className="flex min-h-full flex-row">
        <InnerSidebar />
        <div className="flex-1 overflow-hidden bg-gray-200/75 p-6">{children}</div>
      </div>
    </div>
  );
}
