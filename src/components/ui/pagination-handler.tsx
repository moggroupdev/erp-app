import { PaginatedData } from "@/types/global";
import { Pagination } from "@mantine/core";

export default function PaginationHandler<T>({
  paginatedData,
  activePage,
  setActivePage,
}: {
  paginatedData: PaginatedData<T>;
  activePage: number;
  setActivePage: React.Dispatch<React.SetStateAction<number>>;
}) {
  return paginatedData.pagination.totalPages > 1 ? (
    <div className="flex justify-center">
      <Pagination total={paginatedData.pagination.totalPages} value={activePage} onChange={setActivePage} size="sm" />
    </div>
  ) : null;
}
