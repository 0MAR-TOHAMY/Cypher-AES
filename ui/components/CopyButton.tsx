"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icons";

// منطق النسخ مشترك بين الحقول والنتائج؛ المؤقت يعيد الأيقونة بعد رسالة النجاح.
export default function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const id = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setStatus("idle");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 1500);
  }
  return (
    <span className="tooltip-wrap">
      <button
        type="button"
        className="icon-copy"
        aria-label={`نسخ ${label}`}
        aria-describedby={id}
        disabled={!value}
        onClick={copy}
      >
        <Icon name={status === "copied" ? "check" : "copy"} size={16} />
      </button>
      <span role="tooltip" id={id} className="icon-tooltip">
        {status === "copied"
          ? "تم النسخ"
          : status === "failed"
            ? "تعذر النسخ؛ انسخ القيمة يدويًا"
            : "نسخ"}
      </span>
    </span>
  );
}
