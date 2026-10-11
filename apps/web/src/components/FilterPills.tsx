"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Sliding "droplet" indicator that glides to the active pill instead of each button toggling its own bg. */
export function FilterPills({ options, value, onChange }: { options: readonly { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const btn = btnRefs.current[value];
    if (container && btn) {
      const c = container.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setRect({ left: b.left - c.left, width: b.width });
    }
  }, [value, options]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-1.5">
      {rect && (
        <span
          className="absolute top-0 h-full rounded-full bg-accent transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ left: rect.left, width: rect.width }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          ref={(el) => {
            btnRefs.current[o.value] = el;
          }}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            value === o.value ? "text-white" : "border border-line bg-transparent text-muted hover:bg-surface-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
