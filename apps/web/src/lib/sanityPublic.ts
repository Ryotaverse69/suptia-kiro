import { createClient } from "@sanity/client";
import { SANITY_PROJECT_ID, SANITY_DATASET } from "@/env";

// Public client for client-side usage (no token, CDN enabled)
// This client is safe for client-side use as it contains no sensitive tokens
export const sanityPublic = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-07-01",
  useCdn: true, // Enable CDN for better performance
  perspective: "published", // Only published content
  // Explicitly no token - this client is for public, read-only access
});
