import { createClient } from "@sanity/client";
import { SANITY_PROJECT_ID, SANITY_DATASET } from "@/env";

// Public client for client-side usage (no token, CDN enabled)
export const sanityPublic = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-07-01",
  useCdn: true, // Enable CDN for better performance
  perspective: "published", // Only published content
});
