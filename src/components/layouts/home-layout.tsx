import Header from "@/components/global/header";
import { HEADER_HIGHT } from "@/lib/constants/global";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <Header height={HEADER_HIGHT} />
        <div style={{ minHeight: `calc(100vh - ${HEADER_HIGHT}px)` }} className="flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
