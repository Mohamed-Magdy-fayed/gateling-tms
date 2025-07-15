"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button, SpinnerButton } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/useTranslation"
import { signIn } from "next-auth/webauthn"
import { api } from "@/trpc/react"
import { LogInIcon } from "lucide-react"

const formSchema = z.object({
    email: z.string().email(),
})

export default function QuickLoginForm() {
    const { t } = useTranslation()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    const checkUserMutation = api.authRouter.checkUser.useMutation()

    async function onSubmit({ email }: z.infer<typeof formSchema>) {
        const userExists = await checkUserMutation.mutateAsync(email)

        if (!userExists.exists) {
            form.setError("email", {
                type: "manual",
                message: t("errors.invalidEmail"),
            })
            return
        }
        signIn("passkey", { email })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("auth.email")}</FormLabel>
                            <FormControl>
                                <Input placeholder="example@mail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <SpinnerButton type="submit" icon={LogInIcon} isLoading={checkUserMutation.isPending} className="w-full" text={t("system.userMenu.login")} />
            </form>
        </Form>
    )
}
