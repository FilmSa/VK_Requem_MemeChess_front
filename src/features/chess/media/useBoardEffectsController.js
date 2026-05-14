import { useEffect, useRef, useState } from "react";
import { getBoardEffectConfig } from "./effectsManifest.js";
import {
  readStoredMemeEffectsVolume,
  subscribeMemeEffectsVolumeChanges,
} from "../../../shared/lib/memeEffectsVolume.js";

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

export function useBoardEffectsController() {
  const [activeEffects, setActiveEffects] = useState([]);
  const timeoutsRef = useRef(new Map());
  const activeAudioEntriesRef = useRef(new Set());
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

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
      activeAudioEntriesRef.current.forEach(({ audio }) => {
        audio.pause();
        audio.src = "";
      });
      activeAudioEntriesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    return subscribeMemeEffectsVolumeChanges((volume) => {
      memeEffectsVolumeRef.current = volume;
      updateActiveAudioVolumes(volume);
    });
  }, []);

  function playSound(src, volume = 1) {
    try {
      const audio = new Audio(src);
      const entry = {
        audio,
        baseVolume: Math.min(1, Math.max(0, volume)),
      };
      const unregisterAudio = () => {
        activeAudioEntriesRef.current.delete(entry);
      };

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

  function removeEffect(instanceId) {
    const timeoutId = timeoutsRef.current.get(instanceId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(instanceId);
    }

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
      duration: options.duration ?? config.duration ?? 1500,
      square: options.square ?? null,
      from: options.from ?? null,
      to: options.to ?? null,
      piece: options.piece ?? null,
    };

    if (config.sound) {
      playSound(config.sound, config.volume ?? 1);
    }

    setActiveEffects((current) => [...current, effectInstance]);

    const timeoutId = window.setTimeout(() => {
      setActiveEffects((current) =>
        current.filter((item) => item.instanceId !== instanceId)
      );
      timeoutsRef.current.delete(instanceId);
    }, effectInstance.duration);

    timeoutsRef.current.set(instanceId, timeoutId);

    return instanceId;
  }

  function clearEffects() {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    setActiveEffects([]);
  }

  return {
    activeEffects,
    triggerEffect,
    removeEffect,
    clearEffects,
  };
}
