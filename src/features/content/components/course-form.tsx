"use client"

import { ImagePlus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import ImageUploader from "@/services/firebase/components/ImageUploader";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import { useTranslation } from "@/i18n/useTranslation";

export default function CourseForm<T extends FieldValues>({ form, courseId, children, onSubmit }: {
    children?: ReactNode;
    courseId?: string;
    form: UseFormReturn<T>;
    onSubmit: (data: T) => void;
}) {
    const { t } = useTranslation()
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name={"image" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImageUploader
                                    folder={courseId ? `/courses/${courseId}/` : undefined}
                                    value={field.value ?? ""}
                                    disabled={uploadingImage}
                                    onChange={(url) => field.onChange(url)}
                                    onLoading={setUploadingImage}
                                    onRemove={() => field.onChange("")}
                                    customeImage={
                                        form.getValues().image ? (
                                            <Image width={240} height={160} src={form.getValues().image ?? ""} alt="course image" />
                                        ) : (
                                            <Skeleton className="w-32 h-20 grid place-content-center">
                                                <ImagePlus />
                                            </Skeleton>
                                        )}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"name" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("content.courseForm.name")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("content.courseForm.namePlaceholder")} {...field} />
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
                            <FormLabel>{t("content.courseForm.description")}</FormLabel>
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
