"use client"

import WrapWithTooltip from "@/components/general/wrap-with-tooltip"
import { Button } from "@/components/ui/button"
import { signInAction, signOutAction } from "@/features/auth/actions"
import { useTranslation } from "@/i18n/useTranslation"

export function SignIn(props: React.ComponentPropsWithRef<typeof Button>) {
    const { t } = useTranslation()

    return (
        <form
            action={async () => {
                await signInAction()
            }}
        >
            <WrapWithTooltip text={props.title || t("system.userMenu.login")}>
                <Button {...props}>{props.children ?? t("sidebar.logout")}</Button>
            </WrapWithTooltip>
        </form>
    )
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
    const { t } = useTranslation()

    return (
        <form
            action={async () => {
                await signOutAction()
            }}
            className="w-full"
        >
            <WrapWithTooltip text={props.title || t("system.userMenu.logout")}>
                <Button {...props}>{props.children ?? t("system.userMenu.logout")}</Button>
            </WrapWithTooltip>
        </form>
    )
}
