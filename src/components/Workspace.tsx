"use client";
import { fromHex, toHex } from "@/lib/crypto/encoding";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { AesMode } from "@/lib/types";
import { generateAesKey, randomBytes } from "@/lib/crypto/keys";
import { encryptManual, decryptManual } from "@/lib/workflows/manual";

import { parseModeParameter } from "@/lib/crypto/parameters";
import { Icon } from "./Icons";
import KeyGenerator from "./KeyGenerator";
import ValueField from "./ValueField";
import { SlideConfirm } from "./bencho/upstream/slide-confirm/SlideConfirm";
import PreviewPanel, { type PreviewResult } from "./PreviewPanel";
import ResultSheet, { useIsMobile } from "./ResultSheet";
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

// قسم مرقّم في لوحة التحكم؛ تنسيق فقط بلا منطق.
function PanelGroup({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-group">
      <div className="group-title">
        <span className="group-step">{step}</span>
        {title}
      </div>
      {children}
    </div>
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
  // الموبايل: عارض النتيجة درج سفلي؛ يُفتح تلقائيًا عند اكتمال العملية.
  const mobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useEffect(() => {
    if (result) setSheetOpen(true);
  }, [result]);
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

  // صورة جديدة في التشفير = IV/Counter جديد؛ تكرار Counter مع نفس Key يكشف XOR الصورتين.
  function selectImage(file: File | null) {
    setImage(file);
    if (operation === "encrypt") setModeParameter("");
    setResult(null);
    setError("");
    // على الموبايل: اعرض الصورة المختارة فورًا في درج المعاينة.
    if (file) setSheetOpen(true);
  }

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
      selectImage(
        new File([blob], index === 1 ? "tux.png" : "alice.png", {
          type: "image/png",
        }),
      );
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
          <PanelGroup step={1} title="العملية ووضع التشفير">
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
            <div className="field-heading">وضع التشفير (Mode)</div>
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
          </PanelGroup>
          <PanelGroup
            step={2}
            title={
              operation === "encrypt" ? "الصورة الأصلية" : "الصورة المشفرة"
            }
          >
            <Upload
              file={image}
              label={
                operation === "encrypt" ? "اختيار صورة أصلية" : "الصورة المشفرة"
              }
              accept={operation === "encrypt" ? "image/*" : ".png,image/png"}
              onFile={selectImage}
            />
            {operation === "encrypt" && (
              <div className="sample-row">
                <span>جرّب:</span>
                <button onClick={() => chooseSample(1)}>صورة البطريق</button>
                <button onClick={() => chooseSample(2)}>صورة أليس</button>
              </div>
            )}
          </PanelGroup>
          <PanelGroup step={3} title="المفتاح والقيم">
            <ValueField
              tools={operation === "encrypt"}
              id="key"
              label="المفتاح (Key)"
              placeholder="64 hex chars (256-bit)"
              value={keyHex}
              extra={
                <button
                  type="button"
                  className="field-action"
                  title="اشتقاق المفتاح من جملة سرية + Salt"
                  onClick={() => setGeneratorOpen(true)}
                >
                  <Icon name="key" size={14} />
                  من جملة
                </button>
              }
              onChange={(value) => {
                setKeyHex(value);
                setResult(null);
              }}
              onRandom={() => {
                setKeyHex(toHex(generateAesKey()));
                setResult(null);
              }}
            />
            {mode !== "ECB" && (
              <ValueField
                tools={operation === "encrypt"}
                id="mode-parameter"
                label={
                  mode === "CBC"
                    ? "متجه البدء (IV)"
                    : "العداد الابتدائي (Counter)"
                }
                placeholder={
                  mode === "CBC"
                    ? "32 hex chars · empty = random"
                    : "decimal, e.g. 85 · empty = random"
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
          </PanelGroup>
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
              width={360}
              corner={12}
            />
          </div>
          <Link className="about-link" href="/about">
            عن المشروع ودور الفريق
          </Link>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
        </section>
        <ResultSheet mobile={mobile} open={sheetOpen} onClose={closeSheet}>
          <PreviewPanel
            result={result}
            operation={operation}
            busy={busy}
            inputPreview={inputPreview}
            stacked={mobile}
            onDownload={() => {
              if (result)
                download(
                  blobFrom(result.png, "image/png"),
                  `${result.basename}-${operation === "encrypt" ? `encrypted-${mode.toLowerCase()}` : "recovered"}.png`,
                );
            }}
          />
        </ResultSheet>
      </div>
      {mobile && (
        <button
          type="button"
          className="sheet-opener"
          data-ready={!!result}
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <Icon name="image" size={16} />
          <span>{result ? "عرض النتيجة" : "عرض المعاينة"}</span>
          {result && <i className="sheet-dot" aria-hidden="true" />}
          <Icon name="up" size={16} />
        </button>
      )}

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
