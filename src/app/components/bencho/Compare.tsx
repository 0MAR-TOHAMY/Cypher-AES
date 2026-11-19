"use client";
import { Icon } from "../Icons";
// Adapted from Bencho Image Compare, MIT. See THIRD_PARTY.md.
import { useEffect, useRef, useState } from "react";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Compare({
  labels = true,
  corner = 4,
  before,
  after,
  replay = 0,
}: {
  before: string;
  after: string;
  replay?: number;
  labels?: boolean;
  corner?: number;
}) {
  const [size, setSize] = useState({ width: 540, height: 430 });
  const W = size.width;
  const H = size.height;
  const [p, setP] = useState(0.5);
  const [bend, setBend] = useState(0);
  const cur = useRef(0.5);
  const target = useRef<number | null>(null);
  const automatic = useRef<{ start: number | null } | null>(null);

  const ends = useRef({ x: 0.5, v: 0 });
  const raf = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ v: number; t: number; last: number } | null>(null);
  const [held, setHeld] = useState(false);

  // حلقة واحدة: كشف تلقائي مدته 8 ثوانٍ أو حركة يدوية، ثم تتوقف عند السكون.
  const loop = () => {
    if (raf.current) return;
    let prev = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.033, (t - prev) / 1000);
      prev = t;
      if (automatic.current) {
        if (automatic.current.start === null) automatic.current.start = t;
        const progress = Math.min(1, (t - automatic.current.start) / 8000);
        cur.current = 1 - progress;
        if (progress === 1) {
          automatic.current = null;
          target.current = 0.5;
        }
      } else if (target.current !== null) {
        cur.current +=
          (target.current - cur.current) * (1 - Math.pow(0.0004, dt));
        if (Math.abs(target.current - cur.current) < 0.0005) {
          cur.current = target.current;
          target.current = null;
        }
      }

      const e = ends.current;
      e.v += ((cur.current - e.x) * 620 - e.v * 44) * dt;
      e.x += e.v * dt;
      setP(cur.current);
      setBend(clamp((cur.current - e.x) * W * 0.5, -9, 9));
      const still =
        automatic.current === null &&
        target.current === null &&
        Math.abs(cur.current - e.x) < 0.0006 &&
        Math.abs(e.v) < 0.002;
      if (still) {
        e.x = cur.current;
        e.v = 0;
        setBend(0);
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  // تفاعل المستخدم يلغي الكشف التلقائي ويعيد التحكم للفاصل.
  const glide = (to: number) => {
    automatic.current = null;
    target.current = to;
    loop();
  };

  const place = (v: number) => {
    automatic.current = null;
    target.current = null;
    cur.current = v;
    setP(v);
    loop();
  };
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    // القياسات الفعلية تربط خط الفصل وقص الصورة بالمقاس المتجاوب.
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    automatic.current = null;
    target.current = null;
    // يبدأ توقيت الكشف بعد تحميل الصورتين؛ التنظيف يمنع تكرار RAF في Strict Mode.
    const begin = async () => {
      await Promise.all(
        [before, after].map((src) => {
          const image = new Image();
          image.src = src;
          return image.decode().catch(() => undefined);
        }),
      );
      if (disposed) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cur.current = 0.5;
        setP(0.5);
        return;
      }
      cur.current = 1;
      ends.current = { x: 1, v: 0 };
      setP(1);
      automatic.current = { start: null };
      loop();
    };
    void begin();
    return () => {
      disposed = true;
      automatic.current = null;
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [before, after, replay]);

  const at = (cx: number) => {
    const r = box.current!.getBoundingClientRect();
    return clamp((cx - r.left) / r.width, 0, 1);
  };

  const r = clamp(corner, 0, 28);

  const x = p * W;
  const top = x - bend;
  const curve = `M ${top.toFixed(2)} 0 Q ${(x + bend).toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H}`;
  const cut = `path("M 0 0 L ${top.toFixed(2)} 0 Q ${(x + bend).toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H} L 0 ${H} Z")`;

  return (
    <div
      ref={box}
      className="cmp"
      data-held={held || undefined}
      role="slider"
      tabIndex={0}
      aria-label="مقارنة الصورة قبل وبعد"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      style={
        {
          width: "100%",
          height: "clamp(300px, 45vw, 460px)",
          borderRadius: r,
          "--p": p,
        } as React.CSSProperties
      }
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        const v = at(e.clientX);
        drag.current = { v: 0, t: performance.now(), last: v };
        setHeld(true);
        glide(v);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const v = at(e.clientX);
        const now = performance.now();
        d.v = (v - d.last) / Math.max(1, now - d.t);
        d.t = now;
        d.last = v;
        place(v);
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        setHeld(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}

        if (d && Math.abs(d.v) > 0.0025) {
          glide(d.v > 0 ? 1 : 0);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
        setHeld(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          glide(clamp((target.current ?? cur.current) - 0.1, 0, 1));
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          glide(clamp((target.current ?? cur.current) + 0.1, 0, 1));
        }
      }}
    >
      {}
      <img className="cmp-img cmp-after" src={after} alt="" draggable={false} />
      {}
      <div className="cmp-before" style={{ clipPath: cut }}>
        <img className="cmp-img" src={before} alt="" draggable={false} />
      </div>
      {labels && (
        <>
          <span
            className="cmp-tag"
            style={{ opacity: clamp((p - 0.14) * 4, 0, 1) }}
          >
            قبل
          </span>
          <span
            className="cmp-tag cmp-right"
            style={{ opacity: clamp((0.86 - p) * 4, 0, 1) }}
          >
            بعد
          </span>
        </>
      )}
      <svg
        className="cmp-line"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        <path d={curve} />
      </svg>
      <span className="cmp-grip" style={{ left: x }}>
        <span className="cmp-knob">
          <Icon name="compare" size={18} />
        </span>
      </span>
    </div>
  );
}
