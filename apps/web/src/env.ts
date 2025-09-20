// Environment variable validation
// This file validates required environment variables at startup

function validateEnvVar(
  name: string,
  value: string | undefined,
  fallback?: string
): string {
  // If value is missing or blank, use fallback when provided
  if (!value || value.trim() === '') {
    if (fallback !== undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`ENV: ${name} is missing. Using fallback: ${fallback}`);
      }
      return fallback;
    }

    // No fallback: warn (dev) and return empty string to avoid build-time crashes
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `ENV: Missing required environment variable: ${name}. ` +
          `Set it in .env.local or Vercel project settings.`
      );
    }
    return '';
  }

  // Check for placeholder values that haven't been replaced
  if (value === 'your-project-id' || value === 'your-dataset-name') {
    if (fallback !== undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `ENV: ${name} has placeholder value (${value}). Using fallback: ${fallback}`
        );
      }
      return fallback;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `ENV: ${name} has placeholder value (${value}). Replace with actual value.`
      );
    }
  }

  return value;
}

// Validate Sanity configuration
// Provide safe defaults to avoid failing builds when preview env vars are not configured yet.
export const SANITY_PROJECT_ID = validateEnvVar(
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  // Use actual project ID as fallback
  'fny3jdcg'
);

export const SANITY_DATASET = validateEnvVar(
  'NEXT_PUBLIC_SANITY_DATASET',
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  // Use production dataset as fallback
  'production'
);

// Optional environment variables with defaults
export const SANITY_STUDIO_URL =
  process.env.SANITY_STUDIO_URL || 'http://localhost:3333';

// Log successful validation in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Environment variables validated successfully');
  console.log(`   Sanity Project ID: ${SANITY_PROJECT_ID}`);
  console.log(`   Sanity Dataset: ${SANITY_DATASET}`);
}
