import type { Metadata } from "next";
import { getLocaleCookie } from "@/features/core/i18n/server";

type LocalizedMeta = {
  en: { title: string; description: string };
  ar: { title: string; description: string };
};

export async function buildLocalizedMetadata(
  meta: LocalizedMeta,
): Promise<Metadata> {
  const locale = await getLocaleCookie();
  const localized = locale === "ar" ? meta.ar : meta.en;
  return { title: localized.title, description: localized.description };
}
