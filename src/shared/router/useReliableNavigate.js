import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buildAppHref } from "./buildAppHref.js";

export function useReliableNavigate() {
  const navigate = useNavigate();
  const fallbackTimerRef = useRef(null);
  const fallbackHrefRef = useRef("");

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    fallbackHrefRef.current = "";
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
      fallbackHrefRef.current = fallbackHref;

      fallbackTimerRef.current = window.setTimeout(() => {
        fallbackTimerRef.current = null;

        if (!fallbackHrefRef.current || fallbackHrefRef.current !== fallbackHref) {
          return;
        }

        const currentHref = usesHashRouter
          ? `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
          : window.location.href;

        if (currentHref !== fallbackHref) {
          window.location.assign(fallbackHref);
          return;
        }

        fallbackHrefRef.current = "";
      }, 160);
    },
    [clearFallback, navigate]
  );
}
