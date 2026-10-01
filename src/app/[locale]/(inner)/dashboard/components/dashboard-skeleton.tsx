"use client";

import { Skeleton } from "@mantine/core";

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white xl:col-span-7">
          <PanelHeaderSkeleton />
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton height={36} radius="md" />
              <Skeleton height={36} radius="md" />
            </div>
            <Skeleton height={176} radius="lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton height={72} radius="md" />
              <Skeleton height={72} radius="md" />
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white xl:col-span-5">
          <PanelHeaderSkeleton />
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <Skeleton height={28} width={160} radius="md" />
            <div className="grid items-center gap-4 sm:grid-cols-[9.5rem_1fr]">
              <Skeleton height={144} circle className="mx-auto" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} height={28} radius="md" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
              <Skeleton height={40} radius="md" />
              <Skeleton height={40} radius="md" />
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white xl:col-span-8">
          <PanelHeaderSkeleton />
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-5 sm:py-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height={64} radius="lg" />
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white xl:col-span-4">
          <PanelHeaderSkeleton />
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-5 sm:py-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height={60} radius="lg" />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function PanelHeaderSkeleton() {
  return (
    <header className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <Skeleton height={36} width={36} radius="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton height={14} width={140} radius="md" />
        <Skeleton height={12} width="70%" radius="md" />
      </div>
    </header>
  );
}
