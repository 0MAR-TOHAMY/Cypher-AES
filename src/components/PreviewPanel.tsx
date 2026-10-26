"use client";
// عرض الصورة والنتيجة فقط؛ تنفيذ AES يظل خارج هذا المكوّن.
import { useState } from "react";
import { Icon } from "./Icons";
import { Compare } from "./bencho/Compare";
import { SelectGroup } from "./bencho/Controls";

export type PreviewResult = {
  before: string;
  after: string;
  png: Uint8Array;
  basename: string;
};
export default function PreviewPanel({
  result,
  operation,
  busy,
  inputPreview,
  onDownload,
}: {
  result: PreviewResult | null;
  operation: "encrypt" | "decrypt";
  busy: boolean;
  inputPreview: string;
  onDownload: () => void;
}) {
  // اختيار طريقة العرض وإعادة الحركة لا يغيّران البيانات المشفرة.
  const [view, setView] = useState<"compare" | "pair">("compare");
  const [replay, setReplay] = useState(0);
  return (
    <section className="result-panel" aria-label="معاينة النتائج">
      <div className="result-heading">
        <h2>{result ? "قبل / بعد" : "المعاينة"}</h2>
        <span className="result-status">
          {result ? "اكتملت العملية" : busy ? "جارٍ المعالجة" : ""}
        </span>
      </div>
      {result ? (
        <>
          <div className="view-toolbar">
            <SelectGroup
              options={[
                { value: "compare", label: "مقارنة حية" },
                { value: "pair", label: "جنبًا إلى جنب" },
              ]}
              value={view}
              onChange={setView}
              label="عرض النتيجة"
            />
            {view === "compare" && (
              <button
                onClick={() => setReplay((value) => value + 1)}
                aria-label="إعادة العرض"
              >
                <Icon name="refresh" size={18} />
              </button>
            )}
          </div>
          {view === "compare" ? (
            <Compare
              before={result.before}
              after={result.after}
              replay={replay}
            />
          ) : (
            <div className="preview-grid">
              {[
                {
                  url: result.before,
                  label: operation === "encrypt" ? "الأصلية" : "المشفرة",
                },
                {
                  url: result.after,
                  label: operation === "encrypt" ? "المشفرة" : "المسترجعة",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="preview-title">{item.label}</div>
                  <div className="preview-frame">
                    <img src={item.url} alt={item.label} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="download-buttons">
            <button onClick={onDownload}>
              <Icon name="download" size={16} />{" "}
              {operation === "encrypt"
                ? "تحميل الصورة المشفرة"
                : "تحميل الصورة المسترجعة"}
            </button>
          </div>
        </>
      ) : (
        <div className="empty-stage" data-busy={busy}>
          {inputPreview ? (
            <img src={inputPreview} alt="معاينة الصورة المختارة" />
          ) : (
            <div className="empty-prompt">
              <div className="empty-symbol">
                <Icon name="image" size={38} />
              </div>
              <p>اختار صورة لتبدأ</p>
            </div>
          )}
          {busy && <span className="processing-label">جارٍ المعالجة…</span>}
        </div>
      )}
    </section>
  );
}
