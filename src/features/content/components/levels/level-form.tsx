"use client"

import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
import { type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";

export default function LevelForm<T extends FieldValues>({ form, children, onSubmit }: {
    children?: ReactNode;
    form: UseFormReturn<T>;
    onSubmit: (data: T) => void;
}) {
    const { t } = useTranslation()

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name={"name" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.levelForm.name")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("content.levelForm.namePlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                {children}
            </form>
        </Form>
    );
};
