"use client";
// حقل موحد: العنوان فوق الحقل، والأدوات (توليد/نسخ/مسح) جنبه؛ لا ينفّذ اشتقاقًا أو تشفيرًا.
import type { ReactNode } from "react";
import { Icon } from "./Icons";
import CopyButton from "./CopyButton";

export default function ValueField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onRandom,
  tools = true,
  extra,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onRandom: () => void;
  tools?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="value-field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <div className="field-actions">
          {extra}
          {tools && (
            <>
              <button
                type="button"
                className="field-action"
                aria-label={`توليد عشوائي ${label}`}
                title="توليد عشوائي"
                onClick={onRandom}
              >
                <Icon name="random" size={14} />
                توليد
              </button>
              <CopyButton value={value} label={label} />
            </>
          )}
          <button
            type="button"
            className="field-clear"
            aria-label={`مسح ${label}`}
            title="مسح"
            disabled={!value}
            onClick={() => onChange("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
      <input
        id={id}
        className="text-input"
        dir="ltr"
        spellCheck={false}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
