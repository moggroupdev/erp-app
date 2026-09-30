import InnerSidebar from "@/components/global/inner-sidabar";

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="block h-full">
      <div className="flex min-h-full flex-row">
        <InnerSidebar />
        {/* Top padding clears the h-16 mobile header. lg restores the desktop page padding. */}
        <div className="min-h-0 flex-1 overflow-hidden bg-gray-200/75 p-4 pt-20 sm:p-6 sm:pt-22 lg:p-6 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
