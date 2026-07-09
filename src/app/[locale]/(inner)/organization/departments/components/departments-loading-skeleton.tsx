import { Skeleton } from "@mantine/core";

const skeletonCards = Array.from({ length: 10 });

export default function DepartmentsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {skeletonCards.map((_, index) => (
        <article key={index} className="flex h-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Skeleton height={60} width={60} radius="lg" />

              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton height={20} width={160} radius="md" />
                <div className="flex items-center gap-2">
                  <Skeleton height={16} circle />
                  <Skeleton height={14} width={120} radius="md" />
                </div>
              </div>
            </div>

            <Skeleton height={36} width={36} radius="md" />
          </div>
        </article>
      ))}
    </div>
  );
}
