import { Alert } from "@mantine/core";
import { CircleAlert } from "lucide-react";

export default function ErrorAlert({
  error,
  fade = false,
  radius = "md",
}: {
  error: string;
  fade?: boolean;
  radius?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Alert color="red" icon={<CircleAlert />} className={fade ? "animate-fade-in" : ""} radius={radius}>
      {error}
    </Alert>
  );
}
