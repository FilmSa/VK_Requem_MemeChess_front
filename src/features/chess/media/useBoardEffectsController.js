import { useEffect, useRef, useState } from "react";
import { getBoardEffectConfig } from "./effectsManifest.js";

export function useBoardEffectsController() {
  const [activeEffects, setActiveEffects] = useState([]);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  function playSound(src, volume = 1) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.currentTime = 0;
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

  function triggerEffect(effectId, options = {}) {
    const config = getBoardEffectConfig(effectId);

    if (!config) {
      console.warn(`Effect "${effectId}" not found`);
      return null;
    }

    const instanceId = `${effectId}-${Date.now()}-${Math.random()}`;

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
