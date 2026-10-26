"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "../../../Icons";
import { Check, Upload as UpIcon } from "../../../Icons";
type F = { id: string; name: string; ext: string; size: number; tint: string };
function Page({ f, size = 40 }: { f: F; size?: number }) {
  return (
    <span className="huge-file">
      <Icon name="file" size={size} />
      <small>{f.ext}</small>
    </span>
  );
}

// اختيار الملف أو إسقاطه يعيد File للأب؛ لا يوجد رفع إلى خادم أو تقدم وهمي.
export function Upload({
  file,
  label,
  accept,
  onFile,
}: {
  file: File | null;
  label: string;
  accept: string;
  onFile: (file: File | null) => void;
}) {
  const [over, setOver] = useState(false);
  const reduced = useReducedMotion();
  const f: F | null = file
    ? {
        id: file.name,
        name: file.name,
        ext: file.name.split(".").pop()?.slice(0, 4).toUpperCase() || "ملف",
        size: file.size,
        tint: "#2458f5",
      }
    : null;
  return (
    <div className="upl" style={{ "--upl-r": "12px" } as React.CSSProperties}>
      <div className="upload-field-tools">
        <button
          type="button"
          className="field-clear"
          aria-label={`مسح ${label}`}
          title="مسح الصورة"
          disabled={!file}
          onClick={() => onFile(null)}
        >
          <Icon name="close" size={15} />
        </button>
      </div>
      <motion.div
        className="upl-zone-wrap"
        animate={{ scale: over && !reduced ? 1.025 : 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <label
          className="upl-zone"
          data-over={over || undefined}
          data-busy={!!f || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
        >
          <input
            type="file"
            accept={accept}
            aria-label={label}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
          {!f ? (
            <>
              <span className="upl-icon">
                <UpIcon size={20} />
              </span>
              <span className="upl-say">
                <b>{over ? "اترك الملف هنا" : label}</b>
                <span>اسحب الملف أو اضغط للاختيار</span>
              </span>
            </>
          ) : (
            <span className="upl-now" key={f.id}>
              <Page f={f} size={36} />
              <span className="upl-text">
                <span className="upl-name">{f.name}</span>
                <span className="upl-meta">
                  {Math.round(f.size / 1024)} كيلوبايت
                </span>
              </span>
              <span className="upl-end">
                <span className="upl-tick">
                  <Check size={14} />
                </span>
              </span>
            </span>
          )}
        </label>
      </motion.div>
    </div>
  );
}
