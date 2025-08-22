import { createClient } from "@sanity/client";
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION } from "@/env";

// Public client for client-side usage (no token, CDN enabled)
export const sanityPublic = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true, // Enable CDN for better performance
  perspective: "published", // Only published content
});
