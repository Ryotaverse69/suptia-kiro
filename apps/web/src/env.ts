// Environment variable validation (Zod)
// - 必須チェックは維持
// - 本番 (production) のみ fail-fast（throw）
// - それ以外（preview/development/test）は warn + デフォルトで継続

import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const placeholders = new Set(["your-project-id", "your-dataset-name"]);

const nonEmpty = z
  .string({ required_error: "Environment variable is required" })
  .min(1, "Environment variable cannot be empty");

function throwMissing(name: string): never {
  throw new Error(
    `Missing required environment variable: ${name}\n` +
      `Please check your .env.local file and ensure ${name} is set.\n` +
      `See .env.local.example for reference.`,
  );
}

function throwPlaceholder(name: string, value: string): never {
  throw new Error(
    `Environment variable ${name} contains placeholder value: ${value}\n` +
      `Please replace with your actual Sanity configuration.\n` +
      `See .env.local.example for reference.`,
  );
}

function resolveRequired(name: string, fallback: string): string {
  const raw = process.env[name];

  if (isProd) {
    const parsed = nonEmpty.safeParse(raw);
    if (!parsed.success) {
      return throwMissing(name);
    }
    const value = parsed.data.trim();
    if (placeholders.has(value)) {
      return throwPlaceholder(name, value);
    }
    return value;
  }

  // Non-production: warn and fallback
  if (!raw || raw.trim() === "") {
    console.warn(
      `[env] ${name} is missing; using default: ${fallback} (non-production)`,
    );
    return fallback;
  }
  const value = raw.trim();
  if (placeholders.has(value)) {
    console.warn(
      `[env] ${name} uses placeholder '${value}'; using default: ${fallback} (non-production)`,
    );
    return fallback;
  }
  // Validate non-empty via Zod even in non-production
  return nonEmpty.parse(value);
}

// Sanity configuration
export const SANITY_PROJECT_ID = resolveRequired(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "demo",
);

export const SANITY_DATASET = resolveRequired(
  "NEXT_PUBLIC_SANITY_DATASET",
  "public",
);

// API version (optional, default to example value)
export const SANITY_API_VERSION = (
  process.env.SANITY_API_VERSION || "2025-08-21"
).trim();

// Optional environment variables with defaults
export const SANITY_STUDIO_URL =
  process.env.SANITY_STUDIO_URL || "http://localhost:3333";

// Helpful logs outside production
if (!isProd) {
  console.log("ℹ️ Resolved environment variables (non-production)");
  console.log(`   Sanity Project ID: ${SANITY_PROJECT_ID}`);
  console.log(`   Sanity Dataset: ${SANITY_DATASET}`);
  console.log(`   Sanity API Version: ${SANITY_API_VERSION}`);
}
