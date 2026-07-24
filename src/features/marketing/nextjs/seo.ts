import type { Metadata } from "next";
import { getLocaleCookie } from "@/features/core/i18n/server";

type LocalizedMeta = {
  en: { title: string; description: string };
  ar: { title: string; description: string };
  /**
   * The root layout applies a `"%s | Gateling-TMS"` title template to every
   * page. Pass "absolute" for a page (like the home page) whose title
   * already carries the brand name, so it isn't appended a second time.
   */
  titleMode?: "template" | "absolute";
};

export async function buildLocalizedMetadata(
  meta: LocalizedMeta,
): Promise<Metadata> {
  const locale = await getLocaleCookie();
  const localized = locale === "ar" ? meta.ar : meta.en;
  return {
    title:
      meta.titleMode === "absolute"
        ? { absolute: localized.title }
        : localized.title,
    description: localized.description,
  };
}
