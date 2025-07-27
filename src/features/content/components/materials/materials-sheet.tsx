"use client";

import type { Material } from "@/server/db/schema";
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

import MaterialForm from "@/features/content/components/materials/material-form";
import { materialFormSchema, type MaterialFormData } from "@/features/content/schemas/material-schema";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { useProgress } from "@/components/general/progress-provider";

interface MaterialSheetProps
    extends React.ComponentPropsWithRef<typeof Sheet> {
    material?: Material;
}

export function MaterialSheet({ material, ...props }: MaterialSheetProps) {
    const { t } = useTranslation();
    const { id }: { id: string } = useParams()

    const isUpdate = !!material;
    const form = useForm<MaterialFormData>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: {
            levelId: material?.levelId ?? "",
            title: material?.title ?? "",
            subtitle: material?.subtitle ?? "",
            description: material?.description ?? "",
            order: material?.order ?? 0,
        },
    });

    const trpcUtils = api.useUtils()
    const updateMaterial = api.materialsRouter.update.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.materialSheet.updateSuccess"));
            await trpcUtils.materialsRouter.invalidate();
        }
    });
    const createMaterial = api.materialsRouter.create.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.materialSheet.createSuccess"));
            await trpcUtils.materialsRouter.invalidate();
        }
    });

    async function onSubmit(input: MaterialFormData) {
        if (!id || typeof id !== "string") return toast.error(t("error", { error: "Course ID is required" }));
        if (isUpdate && material) {
            updateMaterial.mutate({
                ids: [material.id],
                ...input,
            });
        } else {
            createMaterial.mutate({ ...input });
        }
    }

    return (
        <Sheet {...props}>
            <SheetContent className="flex flex-col gap-6 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>
                        {isUpdate ? t("content.materialSheet.updateTitle") : t("content.materialSheet.createTitle")}
                    </SheetTitle>
                    <SheetDescription>
                        {isUpdate ? t("content.materialSheet.updateDescription") : t("content.materialSheet.createDescription")}
                    </SheetDescription>
                </SheetHeader>
                <MaterialForm<MaterialFormData> form={form} onSubmit={onSubmit}>
                    <SheetFooter className="gap-2 pt-2 sm:space-x-0">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t("content.materialSheet.cancel")}
                            </Button>
                        </SheetClose>
                        <SpinnerButton
                            type="submit"
                            text={isUpdate ? t("content.materialSheet.save") : t("content.materialSheet.create")}
                            icon={SaveIcon}
                            isLoading={updateMaterial.isPending || createMaterial.isPending}
                        />
                    </SheetFooter>
                </MaterialForm>
            </SheetContent>
        </Sheet>
    );
}
