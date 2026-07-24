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
  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    lastModified: new Date(),
  }));
}
