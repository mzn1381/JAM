"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RUNTIME_CONFIG, RuntimeConfig } from "@/types/runtime-config";

export function useRuntimeConfig(): RuntimeConfig {
  const [config, setConfig] = useState<RuntimeConfig>(DEFAULT_RUNTIME_CONFIG);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/runtime-config", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? (res.json() as Promise<RuntimeConfig>) : null))
      .then((data) => {
        if (data) setConfig((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        // keep defaults on failure/abort
      });

    return () => controller.abort();
  }, []);

  return config;
}
