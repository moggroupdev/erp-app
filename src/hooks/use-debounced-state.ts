import { useEffect, useRef, useState } from "react";

export default function useDebouncedState<T>(initialValue: T, delay: number = 350) {
  const [value, setPendingValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setImmediateValue = (nextValue: T) => {
    cancelDebounce();
    const resolved = nextValue;
    setPendingValue(resolved);
    setDebouncedValue(resolved);
  };

  const cancelDebounce = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    cancelDebounce();

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delay);

    return cancelDebounce;
  }, [value, delay]);

  return {
    value,
    debouncedValue,
    setImmediateValue,
    setPendingValue,
    cancelDebounce,
  };
}
