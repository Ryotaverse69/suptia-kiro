import "server-only";
import { createClient } from "@sanity/client";
import { SANITY_PROJECT_ID, SANITY_DATASET } from "@/env";

// Server-side client with potential token access
export const sanityServer = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-07-01",
  useCdn: false, // Disable CDN for server-side to get fresh data
  token: process.env.SANITY_API_TOKEN, // Optional token for write operations
  perspective: process.env.SANITY_API_TOKEN ? "previewDrafts" : "published",
});
