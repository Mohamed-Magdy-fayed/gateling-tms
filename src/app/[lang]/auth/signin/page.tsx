import { FooterCopywrite } from "@/components/footer";
import { LoginForm } from "@/features/auth/components/login-form";
import { getI18n } from "@/i18n/lib/get-translations";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const session = await auth();
    const { t } = await getI18n(lang);

    if (session?.user) redirect(session.user.roles.includes("admin") ? "/dashboard" : "/");

    return (
        <div className="bg-gradient-to-br from-background to-muted min-h-svh flex flex-col items-center">
            <div className="w-full max-w-sm md:max-w-3xl flex-1 grid place-content-center">
                <LoginForm />
            </div>
            <div className="mt-auto max-w-7xl">
                <FooterCopywrite />
            </div>
        </div>
    )
}
