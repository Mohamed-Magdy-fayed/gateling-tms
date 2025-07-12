import { type Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { P } from "@/components/ui/typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/i18n/lib/get-translations";

export const metadata: Metadata = {
    title: "Error",
    description: "An error occurred during authentication",
};

export default async function AuthErrorPage({ params, searchParams }: { params: Promise<{ lang: string }>, searchParams: Promise<{ [key: string]: string }> }) {
    const { lang } = await params;
    const search = await searchParams;
    const { t } = await getI18n(lang);

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <Link
                href="/"
                className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "absolute left-4 top-4 md:left-8 md:top-8"
                )}
            >
                {t("auth.backToHome")}
            </Link>
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">{t("auth.error.title")}</CardTitle>
                        <CardDescription className="text-center">
                            {t("auth.error.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <P className="text-center text-sm text-muted-foreground">
                            {search.error}
                        </P>
                        <div className="flex justify-center mt-4">
                            <Link
                                href="/auth/signin"
                                className={cn(buttonVariants({ variant: "default" }))}
                            >
                                {t("auth.error.signInAgain")}
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
