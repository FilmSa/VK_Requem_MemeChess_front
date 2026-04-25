import { useCallback, useEffect, useRef, useState } from "react";
import { leaveMatchSearch, searchMatch } from "../gameApi.js";

const MATCH_SEARCH_POLL_INTERVAL_MS = 2000;

function formatStakeRange(minStake, maxStake) {
  if (!Number.isFinite(minStake) || !Number.isFinite(maxStake)) {
    return "";
  }

  return minStake === maxStake ? `${minStake}` : `${minStake} - ${maxStake}`;
}

export function useMatchmaking({
  token,
  isAuthenticated,
  isInitializing,
  onAuthRequired,
  onMatched,
  onCurrencyChanged,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activeSearchRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const requestVersionRef = useRef(0);
  const runSearchRef = useRef(null);

  const clearPollTimer = useCallback(() => {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const notifyCurrencyChanged = useCallback(() => {
    Promise.resolve(onCurrencyChanged?.()).catch(() => {});
  }, [onCurrencyChanged]);

  const runSearch = useCallback(
    async (params, requestVersion) => {
      try {
        const result = await searchMatch(params, token);
        if (requestVersionRef.current !== requestVersion) {
          return;
        }

        if (result.status === "matched" && result.gameId) {
          clearPollTimer();
          activeSearchRef.current = null;
          setIsSearching(false);
          setErrorMessage("");
          setStatusMessage("Матч найден. Подключаем к игре...");
          notifyCurrencyChanged();
          onMatched?.(result);
          return;
        }

        setIsSearching(true);
        setErrorMessage("");
        setStatusMessage(
          `Ищем соперника на ставку ${formatStakeRange(
            params.minStake,
            params.maxStake
          )}...`
        );

        clearPollTimer();
        pollTimeoutRef.current = window.setTimeout(() => {
          runSearchRef.current?.(params, requestVersion);
        }, MATCH_SEARCH_POLL_INTERVAL_MS);
      } catch (error) {
        if (requestVersionRef.current !== requestVersion) {
          return;
        }

        clearPollTimer();
        activeSearchRef.current = null;
        setIsSearching(false);
        setStatusMessage("");
        setErrorMessage(error?.message || "Не удалось запустить матчмейкинг.");

        if (error?.status === 401) {
          onAuthRequired?.();
        }

        if (error?.status === 409) {
          notifyCurrencyChanged();
        }
      }
    },
    [clearPollTimer, notifyCurrencyChanged, onAuthRequired, onMatched, token]
  );

  useEffect(() => {
    runSearchRef.current = runSearch;
  }, [runSearch]);

  const startSearch = useCallback(
    async (params) => {
      if (isInitializing) {
        return;
      }

      if (!isAuthenticated || !token) {
        onAuthRequired?.();
        return;
      }

      requestVersionRef.current += 1;
      const requestVersion = requestVersionRef.current;

      activeSearchRef.current = params;
      clearPollTimer();
      setIsSearching(true);
      setErrorMessage("");
      setStatusMessage("Подключаем поиск соперника...");

      await runSearch(params, requestVersion);
    },
    [
      clearPollTimer,
      isAuthenticated,
      isInitializing,
      onAuthRequired,
      runSearch,
      token,
    ]
  );

  const cancelSearch = useCallback(
    async ({ silent = false } = {}) => {
      const hasActiveSearch = Boolean(activeSearchRef.current);

      requestVersionRef.current += 1;
      clearPollTimer();
      activeSearchRef.current = null;
      setIsSearching(false);

      if (!silent) {
        setErrorMessage("");
        setStatusMessage(hasActiveSearch ? "Поиск соперника остановлен." : "");
      }

      if (!hasActiveSearch || !token) {
        return;
      }

      try {
        await leaveMatchSearch(token);
      } catch (error) {
        if (!silent) {
          setErrorMessage(error?.message || "Не удалось выйти из поиска.");
        }
      }
    },
    [clearPollTimer, token]
  );

  useEffect(() => {
    return () => {
      const hasActiveSearch = Boolean(activeSearchRef.current);

      requestVersionRef.current += 1;
      clearPollTimer();

      if (hasActiveSearch && token) {
        void leaveMatchSearch(token).catch(() => {});
      }

      activeSearchRef.current = null;
    };
  }, [clearPollTimer, token]);

  return {
    isSearching,
    statusMessage,
    errorMessage,
    startSearch,
    cancelSearch,
  };
}
