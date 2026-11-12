"use client";
// على الموبايل: عارض النتيجة درج من الأسفل (90% من الشاشة) فوق overlay مموّه.
// يُغلق بالسحب لأسفل من الشرطة أو بالضغط على الـoverlay أو Escape.
// المحتوى يظل mounted دائمًا، فتبقى حالته كما هي بين الفتح والقفل.
// على الكمبيوتر: لا شيء من ذلك، والمحتوى يُعرض في مكانه كالمعتاد.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";

export function useIsMobile(query = "(max-width: 720px)") {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return mobile;
}

export default function ResultSheet({
  mobile,
  open,
  onClose,
  children,
}: {
  mobile: boolean;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const controls = useDragControls();
  // الضغط على الشرطة يغلق، لكن السحب القصير اللي رجع مكانه ما يتحسبش ضغطة.
  const dragged = useRef(false);
  const shown = mobile && open;

  useEffect(() => {
    if (!shown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, onClose]);

  return (
    <div className="sheet-root" data-mobile={mobile} data-open={shown}>
      {mobile && (
        <div className="sheet-overlay" aria-hidden="true" onClick={onClose} />
      )}
      <motion.div
        className="sheet"
        role={mobile ? "dialog" : undefined}
        aria-modal={shown || undefined}
        aria-label={mobile ? "عارض النتيجة" : undefined}
        inert={mobile && !open ? true : undefined}
        drag={mobile ? "y" : false}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 500) onClose();
        }}
        initial={false}
        animate={{ y: mobile && !open ? "100%" : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 40 }}
      >
        {mobile && (
          <button
            type="button"
            className="sheet-handle"
            aria-label="إغلاق عارض النتيجة"
            onPointerDown={(event) => {
              dragged.current = false;
              controls.start(event);
            }}
            onClick={() => {
              if (!dragged.current) onClose();
            }}
          >
            <span />
          </button>
        )}
        {children}
      </motion.div>
    </div>
  );
}
