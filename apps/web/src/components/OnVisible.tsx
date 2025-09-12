"use client";

import React, { useEffect, useRef, useState } from 'react';

export function OnVisible({
  children,
  rootMargin = '200px 0px',
  once = true,
  intrinsicHeight = 800,
  placeholder = null,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  once?: boolean;
  intrinsicHeight?: number;
  placeholder?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [rootMargin, once, visible]);

  const reserveStyle: React.CSSProperties = !visible
    ? {
        contentVisibility: 'auto',
        containIntrinsicSize: `${intrinsicHeight}px`,
      }
    : {};

  return (
    <div ref={ref} style={reserveStyle} aria-busy={!visible}>
      {children}
      {/* 置き換え時の視覚的プレースホルダ（高さはcontain-intrinsic-sizeで確保済み） */}
      {!visible && placeholder}
    </div>
  );
}

export default OnVisible;
