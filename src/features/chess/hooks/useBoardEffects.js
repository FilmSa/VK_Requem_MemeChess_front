import { useEffect, useRef, useState } from "react";
import { getEffectConfig } from "../effects/effectsRegistry";

export function useBoardEffects() {
  const [activeEffects, setActiveEffects] = useState([]);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);
  function playSound(src, volume = 1) {
      try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.currentTime = 0;

        audio.play().catch(() => {
        });
      } catch (e) {
        console.warn("Sound error:", e);
      }
    }

  function removeEffect(instanceId) {
    const timeoutId = timeoutsRef.current.get(instanceId);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(instanceId);
    }

    setActiveEffects((prev) =>
      prev.filter((item) => item.instanceId !== instanceId)
    );
  }

  function effect(effectId, options = {}) {
    const config = getEffectConfig(effectId);

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
      duration: options.duration ?? config.duration ?? 1500,
      square: options.square ?? null,
      from: options.from ?? null,
      to: options.to ?? null,
      piece: options.piece ?? null,
    };
    if (config.sound) {
      playSound(config.sound, config.volume ?? 1);
    }
    
    setActiveEffects((prev) => [...prev, effectInstance]);

    const timeoutId = setTimeout(() => {
      setActiveEffects((prev) =>
        prev.filter((item) => item.instanceId !== instanceId)
      );
      timeoutsRef.current.delete(instanceId);
    }, effectInstance.duration);

    timeoutsRef.current.set(instanceId, timeoutId);

    return instanceId;
  }

  function clearEffects() {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    setActiveEffects([]);
  }

  return {
    activeEffects,
    effect,
    removeEffect,
    clearEffects,
  };
}