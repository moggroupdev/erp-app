import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/hooks";

function isModifiedClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  const anchorTarget = anchor.getAttribute("target");
  return (
    (!!anchorTarget && anchorTarget !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function isSamePageAnchor(anchor: HTMLAnchorElement) {
  if (anchor.origin !== window.location.origin) return false;
  return anchor.pathname === window.location.pathname && anchor.search === window.location.search;
}

export default function useUnsavedChangesWarning(isDirty: boolean) {
  const { translate } = useI18n();
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const confirmNavigation = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm(
      translate(
        "You have unsaved changes. Leave this page and discard them?",
        "لديك تغييرات غير محفوظة. هل تريد مغادرة هذه الصفحة وتجاهلها؟",
      ),
    );
  }, [translate]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function handleClick(event: MouseEvent) {
      if (!isDirtyRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.hasAttribute("download")) return;
      if (isModifiedClick(event, anchor)) return;
      if (isSamePageAnchor(anchor)) return;

      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [confirmNavigation]);

  return confirmNavigation;
}
