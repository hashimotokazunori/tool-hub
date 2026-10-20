"use client";

import { useEffect } from "react";

/** 本番（toolhiroba.com など）でだけ Service Worker を登録する。開発中は登録しない */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
