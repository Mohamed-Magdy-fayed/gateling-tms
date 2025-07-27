"use client"

import { ImagePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
import { type ReactNode } from "react";
import FileDropzone from "@/services/firebase/components/files-dropzone";

export default function CourseForm<T extends FieldValues>({ form, children, onSubmit }: {
    children?: ReactNode;
    form: UseFormReturn<T>;
    onSubmit: (data: T) => void;
}) {

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
                <FormField
                    control={form.control}
                    name={"files" as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <FileDropzone onFilesChange={(files) => field.onChange(files)} />
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
