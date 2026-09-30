"use client";

import { RefreshCw } from "lucide-react";

export default function RefetchButton({ isFetching, onRefetch }: { isFetching: boolean; onRefetch: () => void }) {
  return (
    <button
      onClick={onRefetch}
      disabled={isFetching}
      className="text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-300"
    >
      <RefreshCw size={14} />
    </button>
  );
}
