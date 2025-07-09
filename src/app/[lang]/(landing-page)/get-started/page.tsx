import { getI18n } from "@/i18n/lib/get-translations";
import { auth } from "@/server/auth";
import { GetStartedForm } from "@/featurs/get-started/components/get-started-form";

export default async function GetStartedPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const { t } = await getI18n(lang)
    const session = await auth()

    return (
        <GetStartedForm />
    );
}
