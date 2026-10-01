"use client";

import { Skeleton } from "@mantine/core";

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-3xl bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton height={12} width={120} radius="md" />
                <Skeleton height={32} width={96} radius="md" />
                <Skeleton height={12} width="70%" radius="md" />
              </div>
              <Skeleton height={44} width={44} radius="lg" />
            </div>
          </div>
        ))}
      </div>

      <article className="overflow-hidden rounded-3xl bg-white">
        <ChartHeaderSkeleton />
        <div className="px-5 py-5 sm:px-6">
          <Skeleton height={220} radius="lg" />
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-3xl bg-white">
            <ChartHeaderSkeleton />
            <div className="flex flex-col gap-3 px-5 py-5 sm:px-6">
              {Array.from({ length: 4 }).map((_, row) => (
                <Skeleton key={row} height={44} radius="md" />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ChartHeaderSkeleton() {
  return (
    <header className="border-b border-dashed border-gray-200 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <Skeleton height={36} width={36} radius="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton height={14} width={160} radius="md" />
          <Skeleton height={12} width="75%" radius="md" />
        </div>
      </div>
    </header>
  );
}
