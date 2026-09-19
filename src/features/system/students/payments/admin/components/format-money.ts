/**
 * Formats an amount in the organization's currency. Falls back to a plain
 * number with the code appended if the runtime rejects the code — the
 * column is validated on write, but a browser's ICU tables can still lag.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: string,
): string {
  const tag = locale === "ar" ? "ar" : "en";
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(tag, { minimumFractionDigits: 2 }).format(amount)} ${currency}`;
  }
}
