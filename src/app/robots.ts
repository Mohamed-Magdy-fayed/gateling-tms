import type { MetadataRoute } from "next";
import { baseUrl } from "@/data/env/server";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/settings",
        "/platform",
        "/demo",
        "/auth/",
        "/invite/",
        "/api/",
      ],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
