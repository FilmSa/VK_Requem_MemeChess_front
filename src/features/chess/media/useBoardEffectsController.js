import { useEffect, useRef, useState } from "react";
import { getBoardEffectConfig } from "./effectsManifest.js";
import {
  readStoredMemeEffectsVolume,
  subscribeMemeEffectsVolumeChanges,
} from "../../../shared/lib/memeEffectsVolume.js";

const MEDIA_METADATA_TIMEOUT_MS = 2000;
const MAX_EFFECT_DURATION_MS = 6000;
const mediaDurationCache = new Map();

function resolveEffectConfig(effectSource) {
  if (
    effectSource &&
    typeof effectSource === "object" &&
    typeof effectSource.asset === "string" &&
    typeof effectSource.mediaType === "string"
  ) {
    return effectSource;
  }

  return getBoardEffectConfig(effectSource);
}

function loadMediaDurationMs(src, elementTag, fallbackDuration) {
  if (!src || typeof document === "undefined") {
    return Promise.resolve(fallbackDuration);
  }

  const cacheKey = `${elementTag}:${src}`;
  const cachedDuration = mediaDurationCache.get(cacheKey);
  if (cachedDuration) {
    return cachedDuration;
  }

  const durationPromise = new Promise((resolve) => {
    const mediaElement = document.createElement(elementTag);
    let settled = false;
    let timeoutId = null;

    function cleanup() {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("error", handleError);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      mediaElement.src = "";
    }

    function finalize(durationMs) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(durationMs);
    }

    function handleLoadedMetadata() {
      const durationSeconds = Number.isFinite(mediaElement.duration)
        ? mediaElement.duration
        : 0;
      const durationMs =
        durationSeconds > 0
          ? Math.max(400, Math.round(durationSeconds * 1000))
          : fallbackDuration;

      finalize(durationMs);
    }

    function handleError() {
      finalize(fallbackDuration);
    }

    mediaElement.preload = "metadata";
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("error", handleError);
    timeoutId = window.setTimeout(() => {
      finalize(fallbackDuration);
    }, MEDIA_METADATA_TIMEOUT_MS);
    mediaElement.src = src;
  });

  mediaDurationCache.set(cacheKey, durationPromise);
  return durationPromise;
}

async function resolveEffectDurationMs(effectInstance, fallbackDuration) {
  const cappedFallbackDuration = Math.min(
    MAX_EFFECT_DURATION_MS,
    Math.max(0, Number(fallbackDuration) || 0)
  );
  const durationCandidates = [];

  if (effectInstance?.mediaType === "video" && effectInstance.asset) {
    durationCandidates.push(
      loadMediaDurationMs(effectInstance.asset, "video", cappedFallbackDuration)
    );
  }

  if (
    effectInstance?.sound &&
    effectInstance.sound !== effectInstance.asset
  ) {
    durationCandidates.push(
      loadMediaDurationMs(effectInstance.sound, "audio", cappedFallbackDuration)
    );
  }

  if (!durationCandidates.length) {
    return cappedFallbackDuration;
  }

  const resolvedDurations = await Promise.all(durationCandidates);
  return Math.min(
    MAX_EFFECT_DURATION_MS,
    Math.max(cappedFallbackDuration, ...resolvedDurations)
  );
}

export function useBoardEffectsController() {
  const [activeEffects, setActiveEffects] = useState([]);
  const timeoutsRef = useRef(new Map());
  const activeAudioEntriesRef = useRef(new Set());
  const activeInstanceIdsRef = useRef(new Set());
  const memeEffectsVolumeRef = useRef(readStoredMemeEffectsVolume());

  function updateActiveAudioVolumes(nextLayerVolume = memeEffectsVolumeRef.current) {
    activeAudioEntriesRef.current.forEach((entry) => {
      if (!entry?.audio || entry.audio.ended) {
        activeAudioEntriesRef.current.delete(entry);
        return;
      }

      entry.audio.volume = Math.min(
        1,
        Math.max(0, entry.baseVolume * nextLayerVolume)
      );
    });
  }

  function stopAudioEntry(entry) {
    if (!entry?.audio) {
      return;
    }

    entry.audio.removeEventListener("ended", entry.unregisterAudio);
    entry.audio.removeEventListener("error", entry.unregisterAudio);
    entry.audio.pause();
    entry.audio.src = "";
    entry.unregisterAudio();
  }

  function stopAudioForEffect(instanceId) {
    activeAudioEntriesRef.current.forEach((entry) => {
      if (entry?.effectInstanceId === instanceId) {
        stopAudioEntry(entry);
      }
    });
  }

  function stopAllAudio() {
    activeAudioEntriesRef.current.forEach((entry) => {
      stopAudioEntry(entry);
    });
    activeAudioEntriesRef.current.clear();
  }

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
      activeInstanceIdsRef.current.clear();
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    return subscribeMemeEffectsVolumeChanges((volume) => {
      memeEffectsVolumeRef.current = volume;
      updateActiveAudioVolumes(volume);
    });
  }, []);

  function playSound(src, volume = 1, effectInstanceId = null) {
    try {
      const audio = new Audio(src);
      const entry = {
        audio,
        baseVolume: Math.min(1, Math.max(0, volume)),
        effectInstanceId,
      };
      const unregisterAudio = () => {
        activeAudioEntriesRef.current.delete(entry);
      };
      entry.unregisterAudio = unregisterAudio;

      audio.volume = Math.min(
        1,
        Math.max(0, entry.baseVolume * memeEffectsVolumeRef.current)
      );
      audio.currentTime = 0;
      activeAudioEntriesRef.current.add(entry);
      audio.addEventListener("ended", unregisterAudio, { once: true });
      audio.addEventListener("error", unregisterAudio, { once: true });
      audio.play().catch(() => {});
    } catch (error) {
      console.warn("Sound error:", error);
    }
  }

  function scheduleEffectRemoval(instanceId, delayMs) {
    const existingTimeoutId = timeoutsRef.current.get(instanceId);

    if (existingTimeoutId) {
      window.clearTimeout(existingTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      removeEffect(instanceId);
    }, Math.max(0, delayMs));

    timeoutsRef.current.set(instanceId, timeoutId);
  }

  function removeEffect(instanceId) {
    activeInstanceIdsRef.current.delete(instanceId);
    const timeoutId = timeoutsRef.current.get(instanceId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(instanceId);
    }

    stopAudioForEffect(instanceId);
    setActiveEffects((current) =>
      current.filter((item) => item.instanceId !== instanceId)
    );
  }

  function triggerEffect(effectSource, options = {}) {
    const config = resolveEffectConfig(effectSource);

    if (!config) {
      console.warn(`Effect "${String(effectSource)}" not found`);
      return null;
    }

    const effectIdentifier = config.id || String(effectSource || "effect");
    const instanceId = `${effectIdentifier}-${Date.now()}-${Math.random()}`;

    const effectInstance = {
      instanceId,
      effectId: config.id,
      name: config.name,
      asset: config.asset,
      sound: config.sound,
      mediaType: config.mediaType,
      duration: Math.min(
        MAX_EFFECT_DURATION_MS,
        Math.max(0, Number(options.duration ?? config.duration ?? 1500) || 0)
      ),
      square: options.square ?? null,
      from: options.from ?? null,
      to: options.to ?? null,
      piece: options.piece ?? null,
    };
    const shownAt = Date.now();

    activeInstanceIdsRef.current.add(instanceId);
    if (config.sound) {
      playSound(config.sound, config.volume ?? 1, instanceId);
    }

    setActiveEffects((current) => [...current, effectInstance]);

    void resolveEffectDurationMs(effectInstance, effectInstance.duration).then(
      (resolvedDuration) => {
        if (!activeInstanceIdsRef.current.has(instanceId)) {
          return;
        }

        const normalizedDuration = Math.max(
          0,
          Math.round(resolvedDuration || effectInstance.duration)
        );
        const elapsedMs = Date.now() - shownAt;
        const remainingMs = Math.max(0, normalizedDuration - elapsedMs);

        setActiveEffects((current) =>
          current.map((item) =>
            item.instanceId === instanceId
              ? { ...item, duration: normalizedDuration }
              : item
          )
        );
        scheduleEffectRemoval(instanceId, remainingMs);
      }
    );

    return instanceId;
  }

  function clearEffects() {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    activeInstanceIdsRef.current.clear();
    stopAllAudio();
    setActiveEffects([]);
  }

  return {
    activeEffects,
    triggerEffect,
    removeEffect,
    clearEffects,
  };
}
