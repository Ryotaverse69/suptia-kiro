// Environment variable validation
// This file validates required environment variables at startup

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please check your .env.local file and ensure ${name} is set.\n` +
        `See .env.local.example for reference.`,
    );
  }

  // Check for placeholder values that haven't been replaced
  if (value === "your-project-id" || value === "your-dataset-name") {
    throw new Error(
      `Environment variable ${name} contains placeholder value: ${value}\n` +
        `Please replace with your actual Sanity configuration.\n` +
        `See .env.local.example for reference.`,
    );
  }

  return value;
}

// Validate Sanity configuration
export const SANITY_PROJECT_ID = validateEnvVar(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);

export const SANITY_DATASET = validateEnvVar(
  "NEXT_PUBLIC_SANITY_DATASET",
  process.env.NEXT_PUBLIC_SANITY_DATASET,
);

// Optional environment variables with defaults
export const SANITY_STUDIO_URL =
  process.env.SANITY_STUDIO_URL || "http://localhost:3333";

// Log successful validation in development
if (process.env.NODE_ENV === "development") {
  console.log("✅ Environment variables validated successfully");
  console.log(`   Sanity Project ID: ${SANITY_PROJECT_ID}`);
  console.log(`   Sanity Dataset: ${SANITY_DATASET}`);
}
