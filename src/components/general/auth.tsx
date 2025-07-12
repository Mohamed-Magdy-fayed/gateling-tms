import WrapWithTooltip from "@/components/general/wrap-with-tooltip"
import { Button } from "@/components/ui/button"
import { signInAction, signOutAction } from "@/featurs/auth/actions"

export function SignIn(props: React.ComponentPropsWithRef<typeof Button>) {
    return (
        <form
            action={async () => {
                await signInAction()
            }}
        >
            <WrapWithTooltip text={props.title || "Sign In"}>
                <Button {...props}>{props.children ?? "Sign In"}</Button>
            </WrapWithTooltip>
        </form>
    )
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
    return (
        <form
            action={async () => {
                await signOutAction()
            }}
            className="w-full"
        >
            <WrapWithTooltip text={props.title || "Sign out"}>
                <Button {...props}>{props.children ?? "Sign out"}</Button>
            </WrapWithTooltip>
        </form>
    )
}
