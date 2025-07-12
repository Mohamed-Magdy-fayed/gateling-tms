"use client"

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { api } from "@/trpc/react";
import {
    AlertCircleIcon,
    CheckCircleIcon,
    Loader2Icon,
    ShieldCheckIcon,
    FingerprintIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/webauthn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

export function VerifyEmail() {
    return (
        <Suspense>
            <VerifyEmailEnhanced />
        </Suspense>
    )
}

export function VerifyEmailEnhanced() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const { t, locale } = useTranslation();
    const { status } = useSession();

    const verifyMutation = api.getStartedRouter.verifyEmail.useMutation({
        onSuccess: (data) => {
            if (data.user?.email && status === "unauthenticated") {
                signIn("passkey", { email: data.user.email });
            }
        },
        onError: (err) => {
            toast.error(err.message || t("verifyEmail.error.generic"));
        },
    });

    const handleVerify = async () => {
        if (!token) {
            return toast.error(t("verifyEmail.error.noToken"));
        }
        verifyMutation.mutate(token);
    };

    useEffect(() => {
        handleVerify();
    }, []);

    return (
        <div className="space-y-6">
            {(verifyMutation.isPending || verifyMutation.isIdle) && (
                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Enhanced loading animation */}
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-orange-200 dark:border-gray-600 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheckIcon className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {t("verifyEmail.loading")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t("verifyEmail.loadingDescription")}
                        </p>
                    </div>
                </div>
            )}

            {verifyMutation.isSuccess && (
                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Success animation */}
                    <div className="relative">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                            {t("verifyEmail.success.title")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {verifyMutation.data?.message}
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <ShieldCheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                                        {t("verifyEmail.success.securityNote.title")}
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-400">
                                        {t("verifyEmail.success.securityNote.description")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                        <Link href={`/${locale}/dashboard`}>
                            {t("verifyEmail.success.cta")}
                        </Link>
                    </Button>
                </div>
            )}

            {verifyMutation.isSuccess && (
                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Passwordless setup */}
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                        <FingerprintIcon className="w-12 h-12 text-white" />
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("verifyEmail.passwordless.title")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t("verifyEmail.passwordless.description")}
                        </p>
                    </div>

                    {/* Benefits list */}
                    <div className="w-full bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4" />
                            {t("verifyEmail.passwordless.benefits.title")}
                        </h4>
                        <ul className="space-y-2 text-xs text-orange-700 dark:text-orange-400">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                {t("verifyEmail.passwordless.benefits.security")}
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                {t("verifyEmail.passwordless.benefits.convenience")}
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                {t("verifyEmail.passwordless.benefits.noPasswords")}
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {verifyMutation.isError && (
                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Error animation */}
                    <div className="relative">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                            {t("verifyEmail.error.title")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {verifyMutation.error.message}
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                        {t("verifyEmail.error.troubleshoot.title")}
                                    </p>
                                    <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                                        <li>• {t("verifyEmail.error.troubleshoot.checkLink")}</li>
                                        <li>• {t("verifyEmail.error.troubleshoot.expiredLink")}</li>
                                        <li>• {t("verifyEmail.error.troubleshoot.contactSupport")}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full space-y-3">
                        <Button
                            onClick={handleVerify}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
                            disabled={verifyMutation.isPending}
                        >
                            {verifyMutation.isPending && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
                            {t("verifyEmail.error.retry")}
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/${locale}/get-started`}>
                                {t("verifyEmail.error.backToSignup")}
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}