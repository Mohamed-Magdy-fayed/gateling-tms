export { defineTranslation as dt } from "./defineTranslation"
export { initI18n, type LanguageMessages } from "./init"

export const locales = ["en", "ar"] as const
export type Locale = typeof locales[number]
