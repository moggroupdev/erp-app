"use client";

import { Skeleton } from "@mantine/core";

export default function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton height={40} width={40} radius="xl" />
              <Skeleton height={14} width={140} radius="md" />
              <Skeleton height={32} width={100} radius="md" />
              <Skeleton height={14} width="80%" radius="md" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-3xl bg-white">
            <header className="border-b border-dashed border-gray-200 px-5 py-5 sm:px-6">
              <Skeleton height={16} width={180} radius="md" />
            </header>
            <div className="px-5 py-5 sm:px-6">
              <Skeleton height={220} radius="lg" />
            </div>
          </article>
        ))}
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="overflow-hidden rounded-3xl bg-white">
          <header className="border-b border-dashed border-gray-200 px-5 py-5 sm:px-6">
            <Skeleton height={16} width={200} radius="md" />
          </header>
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton height={14} width={40} radius="md" />
                  <Skeleton height={14} width="30%" radius="md" />
                  <Skeleton height={14} width="20%" radius="md" />
                  <Skeleton height={14} width="20%" radius="md" />
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
