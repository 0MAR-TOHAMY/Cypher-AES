"use client";
// حقل موحد مع التوليد والنسخ والمسح؛ لا ينفّذ اشتقاقًا أو تشفيرًا.
import { Icon } from "./Icons";
import CopyButton from "./CopyButton";
import { LabelInput } from "./bencho/Controls";
export default function ValueField({
  id,
  label,
  value,
  onChange,
  onRandom,
  secret = false,
  tools = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRandom: () => void;
  secret?: boolean;
  tools?: boolean;
}) {
  return (
    <div className="value-field">
      <div className="value-tools">
        <div>
          {tools && (
            <>
              <button
                type="button"
                aria-label={`توليد عشوائي ${label}`}
                onClick={() => {
                  onRandom();
                }}
              >
                <Icon name="random" size={14} />
                توليد عشوائي
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
            onClick={() => {
              onChange("");
            }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>
      <LabelInput
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        dir="ltr"
        secret={secret}
      />
    </div>
  );
}
