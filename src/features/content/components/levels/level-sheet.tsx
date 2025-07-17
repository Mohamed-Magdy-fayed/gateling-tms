"use client";

import type { Level } from "@/server/db/schema";
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

import LevelForm from "@/features/content/components/levels/level-form";
import { levelFormSchema, type LevelFormData } from "@/features/content/schemas/level-schema";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";

interface LevelSheetProps
    extends React.ComponentPropsWithRef<typeof Sheet> {
    level?: Level;
}

export function LevelSheet({ level, ...props }: LevelSheetProps) {
    const { t } = useTranslation();
    const { id } = useParams()

    const isUpdate = !!level;
    const form = useForm<LevelFormData>({
        resolver: zodResolver(levelFormSchema),
        defaultValues: {
            name: level?.id ?? "",
        },
        values: { name: level?.name ?? "" },
    });

    const trpcUtils = api.useUtils()
    const updateLevel = api.levelsRouter.update.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.levelSheet.updateSuccess"));
            trpcUtils.levelsRouter.invalidate();
        }
    });
    const createLevel = api.levelsRouter.create.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.levelSheet.createSuccess"));
            trpcUtils.levelsRouter.invalidate();
        }
    });

    function onSubmit(input: LevelFormData) {
        if (!id || typeof id !== "string") return toast.error(t("error", { error: "Course ID is required" }));
        if (isUpdate && level) {
            updateLevel.mutate({
                ids: [level.id],
                ...input,
            });
        } else {
            createLevel.mutate({ ...input, courseId: id });
        }
    }

    return (
        <Sheet {...props}>
            <SheetContent className="flex flex-col gap-6 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>
                        {isUpdate ? t("content.levelSheet.updateTitle") : t("content.levelSheet.createTitle")}
                    </SheetTitle>
                    <SheetDescription>
                        {isUpdate ? t("content.levelSheet.updateDescription") : t("content.levelSheet.createDescription")}
                    </SheetDescription>
                </SheetHeader>
                <LevelForm<LevelFormData> form={form} onSubmit={onSubmit}>
                    <SheetFooter className="gap-2 pt-2 sm:space-x-0">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t("content.levelSheet.cancel")}
                            </Button>
                        </SheetClose>
                        <SpinnerButton
                            type="submit"
                            text={isUpdate ? t("content.levelSheet.save") : t("content.levelSheet.create")}
                            icon={SaveIcon}
                            isLoading={updateLevel.isPending || createLevel.isPending}
                        />
                    </SheetFooter>
                </LevelForm>
            </SheetContent>
        </Sheet>
    );
}
