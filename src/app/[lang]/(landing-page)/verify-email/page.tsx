import { VerifyEmail } from "@/features/get-started/components/verify-email";
import { Suspense } from "react";
import Image from "next/image";
import { getI18n } from "@/i18n/lib/get-translations";
import { auth } from "@/server/auth";

export default async function VerifyEmailPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t } = await getI18n(lang)
  const session = await auth()

  return (
    <div className="relative bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 dark:bg-orange-800/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/30 dark:bg-orange-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <Image src="/logo.png" alt="Logo" height={500} width={500} className='w-8 h-8 rounded-md' />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gateling-Solutions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t("verifyEmail.subtitle")}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-orange-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              {t("verifyEmail.title")}
            </h2>
            <p className="text-orange-100 text-sm">
              {t("verifyEmail.description")}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <Suspense
              fallback={
                <div className="flex flex-col items-center gap-6 py-8">
                  {/* Enhanced loading animation */}
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-orange-200 dark:border-gray-600 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t("verifyEmail.loading")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {t("verifyEmail.loadingDescription")}
                    </p>
                  </div>
                </div>
              }
            >
              <VerifyEmail />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {t("verifyEmail.footer.security")}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="#" className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs transition-colors">
              {t("verifyEmail.footer.help")}
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a href="#" className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs transition-colors">
              {t("verifyEmail.footer.contact")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
