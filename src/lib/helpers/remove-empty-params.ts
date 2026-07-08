import { Dictionary } from "@/types/api";

export default function removeEmptyParams<T extends Dictionary>(params: T) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      // Check for "truthy" values, but specifically allow 0 (if it's a valid param)
      // or just use !!value if you want to strip null, undefined, and empty strings.
      if (value !== null && value !== undefined && value !== "") acc[key] = String(value);
      return acc;
    },
    {} as Record<string, string>,
  );
}
