"use client";

import { Button } from "@mantine/core";
import { RefreshCw } from "lucide-react";

export default function RefetchButton({ isFetching, onRefetch }: { isFetching: boolean; onRefetch: () => void }) {
  return (
    <Button variant="light" color="dark" radius="md" px="sm" disabled={isFetching} onClick={onRefetch}>
      <RefreshCw size={15} />
    </Button>
  );
}
