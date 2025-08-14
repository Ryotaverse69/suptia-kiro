"use client";

import { WarningBanner } from "@/components/WarningBanner";
import { evaluatePersonaWarnings, type Persona } from "@/lib/persona-rules";

interface PersonaWarningsProps {
  text: string;
  personas: Persona[];
  className?: string;
}

// Accessible container that computes persona-based warnings
export function PersonaWarnings({
  text,
  personas,
  className = "",
}: PersonaWarningsProps) {
  const violations = evaluatePersonaWarnings(text, { personas });

  if (violations.length === 0) return null;

  return (
    <section aria-label="表現に関する注意" className={className}>
      <WarningBanner violations={violations} />
    </section>
  );
}
