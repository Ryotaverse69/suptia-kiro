"use client";

import { useEffect, useState } from 'react';

export default function DeferGradientSection({
  className = '',
  gradientClass = 'bg-gradient-to-r from-primary-600 to-secondary-600',
  solidClass = 'bg-primary-600',
  children,
}: {
  className?: string;
  gradientClass?: string;
  solidClass?: string;
  children: React.ReactNode;
}) {
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEnhanced(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <section className={`${enhanced ? gradientClass : solidClass} ${className}`}>
      {children}
    </section>
  );
}

