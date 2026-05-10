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
      const fallbackUrl = new URL(fallbackHref);

      fallbackTimerRef.current = window.setTimeout(() => {
        const hasReachedTarget = usesHashRouter
          ? window.location.hash === `#${to}`
          : window.location.pathname === fallbackUrl.pathname &&
            window.location.search === fallbackUrl.search;

        if (!hasReachedTarget) {
          window.location.assign(fallbackHref);
        }
      }, 160);
    },
    [clearFallback, navigate]
  );
}
