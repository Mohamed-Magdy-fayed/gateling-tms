import { initI18n, type LanguageMessages, type RegisteredTranslations } from "./init";

// Dynamically import all translation files
// This assumes your translation files are structured like i18n/global/en.ts, i18n/global/ar.ts
// and they export a default object of type LanguageMessages.

export const loadAllTranslations = async (): Promise<Record<Lowercase<string>, LanguageMessages>> => {
    const translations: Record<Lowercase<string>, LanguageMessages> = {};
    try {
        // Assuming 'en' and 'ar' are your main locales. Add more as needed.
        const enTranslations = (await import("../global/en")).default;
        const arTranslations = (await import("../global/ar")).default;

        translations.en = enTranslations;
        translations.ar = arTranslations;
    } catch (error) {
        console.error("Failed to load all translations:", error);
        // Return empty object or throw, depending on desired error handling
    }
    return translations;
};

let allTranslationsCache: Record<Lowercase<string>, LanguageMessages> | null = null;

export async function getI18n(locale: string) {
    if (!allTranslationsCache) {
        allTranslationsCache = await loadAllTranslations();
    }

    // initI18n expects a specific structure for translations, so we pass the entire loaded object
    // and let it handle fallback locales internally.
    const { t } = initI18n({
        locale,
        fallbackLocale: "en",
        translations: allTranslationsCache,
    });

    return { locale, t, translations: allTranslationsCache };
}

