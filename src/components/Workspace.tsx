"use client";
import { fromHex, toHex } from "@/lib/crypto/encoding";

import { useEffect, useState } from "react";

import type { AesMode } from "@/lib/types";
import { randomBytes } from "@/lib/crypto/keys";
import { encryptManual, decryptManual } from "@/lib/workflows/manual";

import { parseModeParameter } from "@/lib/crypto/parameters";
import { Icon } from "./Icons";
import KeyGenerator from "./KeyGenerator";
import ValueField from "./ValueField";
import { SlideConfirm } from "./bencho/upstream/slide-confirm/SlideConfirm";
import PreviewPanel, { type PreviewResult } from "./PreviewPanel";
import { Upload, SelectGroup } from "./bencho/Controls";

type Operation = "encrypt" | "decrypt";

const modes: AesMode[] = ["ECB", "CBC", "CTR"];

function blobFrom(bytes: Uint8Array, type: string) {
  return new Blob([new Uint8Array(bytes).buffer], { type });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function basename(filename: string) {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .slice(0, 70) || "image"
  );
}

export default function Workspace() {
  // 1) حالة المدخلات والعملية المختارة؛ لا تُحفظ القيم السرية في التخزين الدائم.
  const [operation, setOperation] = useState<Operation>("encrypt");
  const [mode, setMode] = useState<AesMode>("ECB");
  const [image, setImage] = useState<File | null>(null);
  const [keyHex, setKeyHex] = useState("");
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const [modeParameter, setModeParameter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [inputPreview, setInputPreview] = useState("");

  // 2) إنشاء رابط محلي للمعاينة، وإلغاؤه عند تغيير الملف لتجنب استهلاك الذاكرة.
  useEffect(() => {
    if (!image) {
      setInputPreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setInputPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(
    () => () => {
      if (result) {
        URL.revokeObjectURL(result.before);
        URL.revokeObjectURL(result.after);
      }
    },
    [result],
  );

  function changeOperation(next: Operation) {
    setOperation(next);
    setImage(null);

    setResult(null);
    setError("");
  }

  async function chooseSample(index: 1 | 2) {
    try {
      const response = await fetch(`/samples/sample${index}.png`);
      if (!response.ok) throw new Error("تعذر تحميل صورة المثال.");
      const blob = await response.blob();
      setImage(
        new File([blob], index === 1 ? "tux.png" : "alice.png", {
          type: "image/png",
        }),
      );
      setResult(null);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر تحميل صورة المثال.",
      );
    }
  }

  // 3) التحقق من المدخلات ثم استدعاء workflow المناسب وعرض الناتج فقط.
  async function run() {
    if (!image) {
      setError("اختَر الصورة أولًا.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    try {
      const key = fromHex(keyHex, 32, "Key");
      const iv = parseModeParameter(mode, modeParameter);
      if (operation === "encrypt") {
        const output = await encryptManual(image, key, mode, iv);
        if (mode !== "ECB")
          setModeParameter(
            mode === "CBC"
              ? toHex(output.iv)
              : BigInt(`0x${toHex(output.iv)}`).toString(),
          );
        setResult({
          before: URL.createObjectURL(image),
          after: URL.createObjectURL(blobFrom(output.png, "image/png")),
          png: output.png,
          basename: basename(image.name),
        });
      } else {
        const png = await decryptManual(image, key, mode, iv);
        setResult({
          before: URL.createObjectURL(image),
          after: URL.createObjectURL(blobFrom(png, "image/png")),
          png,
          basename: basename(image.name),
        });
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "حدث خطأ أثناء المعالجة.",
      );
    } finally {
      setBusy(false);
    }
  }

  // 4) تجميع المدخلات والمعاينة والمودال؛ كل جزء له مكوّن مستقل.
  return (
    <main className="shell">
      <div className="workspace-grid">
        <section className="control-panel" aria-label="إعدادات التجربة">
          <button
            type="button"
            className="open-key-generator"
            onClick={() => setGeneratorOpen(true)}
          >
            <Icon name="key" size={17} />
            <span>عمل مفتاح يدوي</span>
          </button>
          <SelectGroup
            options={[
              {
                value: "encrypt",
                label: (
                  <>
                    <Icon name="lock" size={15} />
                    تشفير
                  </>
                ),
              },
              {
                value: "decrypt",
                label: (
                  <>
                    <Icon name="unlock" size={15} />
                    فك التشفير
                  </>
                ),
              },
            ]}
            value={operation}
            onChange={changeOperation}
            label="العملية"
            tabs
          />
          <div className="field-heading">وضع التشفير</div>
          <SelectGroup
            options={modes.map((mode) => ({
              value: mode,
              label: `AES-${mode}`,
            }))}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setModeParameter("");
              setResult(null);
              setError("");
            }}
            label="وضع التشفير"
          />
          <div className="field-heading">
            {operation === "encrypt" ? "الصورة" : "الملفات"}
          </div>
          <Upload
            file={image}
            label={
              operation === "encrypt" ? "اختيار صورة أصلية" : "الصورة المشفرة"
            }
            accept={operation === "encrypt" ? "image/*" : ".png,image/png"}
            onFile={(file) => {
              setImage(file);
              setResult(null);
              setError("");
            }}
          />
          {operation === "encrypt" && (
            <div className="sample-row">
              <span>جرّب:</span>
              <button onClick={() => chooseSample(1)}>صورة البطريق</button>
              <button onClick={() => chooseSample(2)}>صورة أليس</button>
            </div>
          )}
          <ValueField
            tools={operation === "encrypt"}
            id="key"
            label="المفتاح · ٦٤ رمزًا ست عشريًا"
            value={keyHex}
            onChange={(value) => {
              setKeyHex(value);
              setResult(null);
            }}
            onRandom={() => {
              setKeyHex(toHex(randomBytes(32)));
              setResult(null);
            }}
          />
          {mode !== "ECB" && (
            <ValueField
              tools={operation === "encrypt"}
              id="mode-parameter"
              label={
                mode === "CBC"
                  ? 'متجه البدء "IV" · ٣٢ رمزًا ست عشريًا'
                  : 'العداد الابتدائي "Counter"'
              }
              value={modeParameter}
              onChange={(value) => {
                setModeParameter(value);
                setResult(null);
              }}
              onRandom={() => {
                setModeParameter(
                  mode === "CBC"
                    ? toHex(randomBytes(16))
                    : BigInt(`0x${toHex(randomBytes(12))}`).toString(),
                );
                setResult(null);
              }}
            />
          )}
          <p className="field-note">
            {operation === "encrypt"
              ? "احتفظ بالمفتاح والقيم المستخدمة؛ التحميل للصورة فقط."
              : "أدخل نفس المفتاح ووضع التشفير والقيم المستخدمة."}
          </p>
          <div className="execute-control">
            <SlideConfirm
              key={`${operation}-${mode}-${image?.name ?? "empty"}`}
              label={
                busy
                  ? "جارٍ المعالجة…"
                  : operation === "encrypt"
                    ? "تشفير الصورة"
                    : "فك تشفير الصورة"
              }
              onConfirm={run}
              disabled={busy}
              width={310}
              corner={12}
            />
          </div>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
        </section>
        <PreviewPanel
          result={result}
          operation={operation}
          busy={busy}
          inputPreview={inputPreview}
          onDownload={() => {
            if (result)
              download(
                blobFrom(result.png, "image/png"),
                `${result.basename}-${operation === "encrypt" ? `encrypted-${mode.toLowerCase()}` : "recovered"}.png`,
              );
          }}
        />
      </div>

      <KeyGenerator
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onUse={(key) => {
          setKeyHex(key);
          setResult(null);
        }}
      />
    </main>
  );
}
