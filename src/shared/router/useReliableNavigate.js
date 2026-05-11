import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buildAppHref } from "./buildAppHref.js";

export function useReliableNavigate() {
  const navigate = useNavigate();
  const fallbackTimerRef = useRef(null);

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearFallback, [clearFallback]);

  return useCallback(
    (to, options = undefined) => {
      if (!to) {
        return;
      }

      clearFallback();
      navigate(to, options);

      if (typeof window === "undefined") {
        return;
      }

      const usesHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
      const fallbackHref = new URL(buildAppHref(to), window.location.origin).toString();

      fallbackTimerRef.current = window.setTimeout(() => {
        const currentHref = usesHashRouter
          ? `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
          : window.location.href;

        if (currentHref !== fallbackHref) {
          window.location.assign(fallbackHref);
          return;
        }

        window.location.reload();
      }, 160);
    },
    [clearFallback, navigate]
  );
}
