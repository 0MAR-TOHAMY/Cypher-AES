"use client";
// Functional adaptations of Bencho Upload dropzone / Magnetic select.
// Original source and MIT notice: THIRD_PARTY.md.
import { type ReactNode } from "react";

export { Upload } from "./upstream/upload-dropzone/Upload";

export function SelectGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  tabs = false,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  tabs?: boolean;
}) {
  return (
    <div
      className="bench-select"
      role={tabs ? "tablist" : "group"}
      aria-label={label}
    >
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          role={tabs ? "tab" : undefined}
          aria-selected={tabs ? value === option.value : undefined}
          aria-pressed={!tabs ? value === option.value : undefined}
          data-selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
