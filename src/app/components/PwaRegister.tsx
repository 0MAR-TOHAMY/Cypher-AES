"use client";
// تسجيل service worker في نسخة الإنتاج فقط، عشان ما يتعارضش مع dev server.
import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // التطبيق يشتغل عادي من غير service worker؛ بس من غير وضع offline.
    });
  }, []);
  return null;
}
