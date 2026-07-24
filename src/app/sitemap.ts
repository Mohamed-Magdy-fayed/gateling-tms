import type { MetadataRoute } from "next";
import { baseUrl } from "@/data/env/server";

const PUBLIC_ROUTES = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/get-started",
  "/privacy",
  "/terms",
  "/cookies",
  "/refund",
];

export default function sitemap(): MetadataRoute.Sitemap {
  // No lastModified: new Date() would stamp every URL with the current
  // build/request time on each generation, making unchanged routes look
  // freshly updated and triggering unnecessary recrawls. Add it back once
  // there's a real per-route timestamp (e.g. content updatedAt) to report.
  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route, baseUrl).toString(),
  }));
}
