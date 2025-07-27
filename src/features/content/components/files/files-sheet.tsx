"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, SpinnerButton } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import FileForm from "@/features/content/components/files/files-form";
import { fileFormSchema, type FileFormData } from "@/features/content/schemas/file-schema";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

interface FilesSheetProps
    extends React.ComponentPropsWithRef<typeof Sheet> {
    materialId: string;
}

export function FilesSheet(props: FilesSheetProps) {
    const { t } = useTranslation();
    const router = useRouter()

    const form = useForm<FileFormData>({
        resolver: zodResolver(fileFormSchema),
    });

    const createFiles = api.filesRouter.create.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.fileSheet.createSuccess"));
            router.refresh()
        }
    });

    function onSubmit(input: FileFormData) {
        createFiles.mutate({ ...input, materialId: props.materialId });
    }

    return (
        <Sheet {...props}>
            <SheetContent className="flex flex-col gap-6 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>
                        {t("content.fileSheet.createTitle")}
                    </SheetTitle>
                    <SheetDescription>
                        {t("content.fileSheet.createDescription")}
                    </SheetDescription>
                </SheetHeader>
                <FileForm<FileFormData> form={form} onSubmit={onSubmit}>
                    <SheetFooter className="gap-2 pt-2 sm:space-x-0">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t("content.fileSheet.cancel")}
                            </Button>
                        </SheetClose>
                        <SpinnerButton
                            type="submit"
                            text={t("content.fileSheet.create")}
                            icon={SaveIcon}
                            isLoading={createFiles.isPending}
                        />
                    </SheetFooter>
                </FileForm>
            </SheetContent>
        </Sheet>
    );
}
