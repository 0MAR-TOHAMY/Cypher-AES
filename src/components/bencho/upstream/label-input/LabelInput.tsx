"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "../../../Icons";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const W = 280;
const H = 52;

const S = 0.78;

const IN = 0.75;

// حقل Bencho بقيمة يتحكم بها الأب؛ التركيز والقيمة يحددان ارتفاع العنوان.
export function LabelInput({
  field = "Email",
  id: externalId,
  label: externalLabel,
  value: controlledValue,
  onChange,
  dir,

  corner = 20,

  showcase = false,
}: {
  field?: string;
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  dir?: "ltr" | "rtl";
  corner?: number;
  showcase?: boolean;
} = {}) {
  const r = clamp(corner, 0, H / 2);
  const secret = field === "Password";
  const label = externalLabel ?? (secret ? "كلمة السر" : "القيمة");
  const generatedId = useId();
  const id = externalId ?? `lbi-${generatedId.replace(/:/g, "")}`;

  const [focus, setFocus] = useState(false);
  const [quiet] = useState(
    () =>
      showcase &&
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
  const [internalValue, setValue] = useState("");
  const value = controlledValue ?? internalValue;
  const [show, setShow] = useState(false);
  const [flip, setFlip] = useState(0);
  const input = useRef<HTMLInputElement | null>(null);

  const lab = useRef<HTMLLabelElement | null>(null);
  const [lw, setLw] = useState(40);
  useLayoutEffect(() => {
    if (lab.current) setLw(lab.current.offsetWidth);
  }, [label]);

  useEffect(() => {
    setValue("");
    setShow(false);
  }, [field]);

  const up = focus || value.length > 0;

  const lx = Math.max(14, r + 4);
  const x0 = Math.max(r * 0.6, lx - 5);
  const x1 = lx + lw * S + 5;
  const a = r - IN;
  const R = W - IN;
  const B = H - IN;
  const mid = W / 2;

  const nm = (x0 + x1) / 2;
  const gapL = `M${nm},${IN} L${x0},${IN}`;
  const gapR = `M${nm},${IN} L${x1},${IN}`;

  const right =
    r > 0
      ? `M${x1},${IN} L${W - r},${IN} A${a},${a} 0 0 1 ${R},${r} L${R},${H - r} A${a},${a} 0 0 1 ${W - r},${B} L${mid},${B}`
      : `M${x1},${IN} L${R},${IN} L${R},${B} L${mid},${B}`;

  const left =
    r > 0
      ? `M${x0},${IN} L${r},${IN} A${a},${a} 0 0 0 ${IN},${r} L${IN},${H - r} A${a},${a} 0 0 0 ${r},${B} L${mid},${B}`
      : `M${x0},${IN} L${IN},${IN} L${IN},${B} L${mid},${B}`;

  const reveal = () => {
    setShow((s) => !s);
    setFlip((f) => f + 1);
  };

  return (
    <div
      className="lbi"
      data-up={up}
      data-focus={focus}
      data-filled={value.length > 0}
    >
      <div
        className="lbi-box"
        style={
          {
            width: "100%",
            height: H,
            borderRadius: r,
            "--lbi-x": `${lx}px`,
          } as React.CSSProperties
        }
      >
        <svg
          className="lbi-ring"
          width="100%"
          height={H}
          preserveAspectRatio="none"
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
        >
          <path d={right} />
          <path d={left} />
          <path className="lbi-gap" d={gapL} pathLength={1} />
          <path className="lbi-gap" d={gapR} pathLength={1} />
        </svg>

        <label className="lbi-label" htmlFor={id} ref={lab}>
          {[label].map((ch, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </label>

        <input
          ref={input}
          id={id}
          className="lbi-field"
          data-flip={flip % 2}

          type={
            showcase
              ? "text"
              : secret && !show
                ? "password"
                : secret
                  ? "text"
                  : "text"
          }
          name={showcase ? "search-preview" : undefined}
          data-1p-ignore={showcase || undefined}
          data-lpignore={showcase ? "true" : undefined}
          data-bwignore={showcase || undefined}
          data-form-type={showcase ? "other" : undefined}
          autoCorrect="off"
          autoCapitalize="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          dir={dir}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          autoComplete="off"
          spellCheck={false}

          inputMode={quiet ? "none" : undefined}
          style={
            {
              paddingRight: secret ? 48 : lx,
              ...(showcase && secret && !show
                ? { WebkitTextSecurity: "disc" }
                : {}),
            } as React.CSSProperties
          }
        />

        {secret && (
          <button
            className="lbi-eye"
            type="button"
            data-show={show}

            onPointerDown={(e) => e.preventDefault()}
            onClick={reveal}
            aria-label={show ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          >
            <Eye size={16} strokeWidth={2} aria-hidden="true" />
            <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
