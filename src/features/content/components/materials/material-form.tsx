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
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import { SelectField } from "@/components/general/select-field";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";

export default function MaterialForm<T extends FieldValues>({ form, children, onSubmit }: {
    children?: ReactNode;
    form: UseFormReturn<T>;
    onSubmit: (data: T) => void;
}) {
    const { t } = useTranslation()
    const { id }: { id: string } = useParams()

    const { data: levelsData } = api.levelsRouter.queryLevels.useQuery({ courseId: id });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name={"levelId" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.materialForm.level")}</FormLabel>
                            <FormControl>
                                <SelectField
                                    values={!!field.value ? [field.value] : []}
                                    setValues={(values) => {
                                        console.log(values);
                                        field.onChange(values.length > 0 ? values[0] : "")
                                    }}
                                    title={t("content.materialForm.selectLevel")}
                                    options={levelsData?.data.map(lvl => ({
                                        label: lvl.name,
                                        value: lvl.id,
                                    })) ?? []}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"order" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.materialForm.order")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("content.materialForm.orderPlaceholder")} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"title" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.materialForm.title")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("content.materialForm.titlePlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"subtitle" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.materialForm.subtitle")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("content.materialForm.subtitlePlaceholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"description" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.materialForm.description")}</FormLabel>
                            <FormControl>
                                <MarkdownEditor
                                    markdown={field.value ?? ""}
                                    onChange={(val) => field.onChange(val)}
                                />
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
