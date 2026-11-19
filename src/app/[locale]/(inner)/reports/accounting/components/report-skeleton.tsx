"use client";

import { Skeleton } from "@mantine/core";

export default function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton height={40} width={40} radius="xl" />
              <Skeleton height={14} width={140} radius="md" />
              <Skeleton height={32} width={160} radius="md" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 sm:p-6">
        <Skeleton height={18} width={180} radius="md" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={88} radius="lg" />
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 sm:p-6">
        <Skeleton height={18} width={200} radius="md" />
        <Skeleton height={220} radius="lg" className="mt-4" />
      </div>

      <div className="rounded-3xl bg-white p-5 sm:p-6">
        <Skeleton height={18} width={160} radius="md" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height={36} radius="md" />
          ))}
        </div>
      </div>
    </div>
  );
}
