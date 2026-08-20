"use client";

import { Skeleton } from "@mantine/core";

export default function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton height={40} width={40} radius="xl" />
              <Skeleton height={14} width={140} radius="md" />
              <Skeleton height={32} width={180} radius="md" />
              <Skeleton height={14} width="80%" radius="md" />
            </div>
          </div>
        ))}
      </div>

      {/* Order status */}
      <div className="rounded-3xl bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton height={20} width={20} circle />
          <div className="flex flex-col gap-1">
            <Skeleton height={16} width={160} radius="md" />
            <Skeleton height={14} width={240} radius="md" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-1 items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3">
              <Skeleton height={18} width={120} radius="md" />
              <Skeleton height={22} width={40} radius="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <article className="overflow-hidden rounded-3xl bg-white">
        <header className="border-b border-dashed border-stone-200 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <Skeleton height={36} width={36} radius="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton height={16} width={160} radius="md" />
              <Skeleton height={14} width="80%" radius="md" />
            </div>
          </div>
        </header>
        <div className="px-5 py-5 sm:px-6">
          <Skeleton height={192} radius="lg" />
        </div>
      </article>

      {/* Tables */}
      {Array.from({ length: 2 }).map((_, index) => (
        <article key={index} className="overflow-hidden rounded-3xl bg-white">
          <header className="border-b border-dashed border-stone-200 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <Skeleton height={36} width={36} radius="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton height={16} width={180} radius="md" />
                <Skeleton height={14} width="70%" radius="md" />
              </div>
            </div>
          </header>
          <div className="px-5 py-5 sm:px-6">
            <div className="rounded-xl border border-stone-100 p-3">
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton height={14} width={40} radius="md" />
                    <Skeleton height={14} width="25%" radius="md" />
                    <Skeleton height={14} width="20%" radius="md" />
                    <Skeleton height={14} width="20%" radius="md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
