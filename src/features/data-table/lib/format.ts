export function formatDate(
  date: Date | string | number | undefined,
  locale: string,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";
  
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}
