"use client";
import { useEffect, useRef, useState } from "react";
import { deriveKey, generateSecret, randomBytes } from "@/lib/crypto/keys";
import { fromHex, toHex } from "@/lib/crypto/encoding";
import { Icon } from "./Icons";
import CopyButton from "./CopyButton";
import ValueField from "./ValueField";

export default function KeyGenerator({
  open,
  onClose,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  onUse: (key: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phrase, setPhrase] = useState("");
  const [salt, setSalt] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // فتح وإغلاق dialog الأصلي يحافظ على التركيز ويدعم Escape تلقائيًا.
  useEffect(() => {
    if (open && !dialog.current?.open) {
      setOutput("");
      setError("");
      dialog.current?.showModal();
    } else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  // التحقق من Salt ثم اشتقاق Key؛ نجاح العملية يستبدل النموذج بالقيم الناتجة.
  async function derive() {
    setBusy(true);
    setError("");
    try {
      const key = await deriveKey(phrase, fromHex(salt, 16, "الملح"), 210000);
      setOutput(toHex(key));
      key.fill(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء المفتاح.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="key-modal"
      aria-labelledby="key-modal-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id="key-modal-title">
          {output ? "تم إنشاء المفتاح بنجاح" : "عمل مفتاح يدوي"}
        </h2>
        <button type="button" aria-label="إغلاق" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      {output ? (
        <div className="key-success">
          <div className="success-mark">
            <Icon name="check" size={25} />
          </div>
          <ResultValue label="العبارة السرية" value={phrase} />
          <ResultValue label={'الملح "Salt"'} value={salt} />
          <ResultValue label="المفتاح" value={output} />
          <button
            type="button"
            className="use-key"
            onClick={() => {
              onUse(output);
              onClose();
            }}
          >
            استخدام المفتاح
          </button>
          <button
            type="button"
            className="create-again"
            onClick={() => setOutput("")}
          >
            إنشاء مفتاح آخر
          </button>
        </div>
      ) : (
        <>
          <fieldset disabled={busy} className="modal-fields">
            <ValueField
              id="generator-phrase"
              label="العبارة السرية"
              value={phrase}
              onChange={setPhrase}
              onRandom={() => setPhrase(generateSecret())}
            />
            <ValueField
              id="generator-salt"
              label={'الملح "Salt" · ٣٢ رمزًا ست عشريًا'}
              value={salt}
              onChange={setSalt}
              onRandom={() => setSalt(toHex(randomBytes(16)))}
            />
            <button type="button" className="use-key" onClick={derive}>
              {busy ? "جارٍ الإنشاء…" : "إنشاء"}
            </button>
          </fieldset>
          {error && (
            <p className="modal-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </dialog>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="generated-value">
      <div>
        <span>{label}</span>
        <CopyButton value={value} label={label} />
      </div>
      <p dir="auto">{value}</p>
    </div>
  );
}
