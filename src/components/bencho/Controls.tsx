"use client";
// Functional adaptations of Bencho Label input / Upload dropzone / Magnetic select.
// Original source and MIT notice: THIRD_PARTY.md.
import { type ReactNode } from "react";
import { LabelInput as BenchoLabelInput } from "./upstream/label-input/LabelInput";

export function LabelInput({
  id,
  label,
  value,
  onChange,
  secret = false,
  dir,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  secret?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <BenchoLabelInput
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      field={secret ? "Password" : "Text"}
      corner={10}
      dir={dir}
    />
  );
}

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
