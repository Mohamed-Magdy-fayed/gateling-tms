"use client";

import type { Course } from "@/server/db/schema";
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

import CourseForm from "@/features/content/components/course-form";
import { courseFormSchema, type CourseFormData } from "@/features/content/schema";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

interface CourseSheetProps
    extends React.ComponentPropsWithRef<typeof Sheet> {
    course: Course | null;
}

export function CourseSheet({ course, ...props }: CourseSheetProps) {
    const { t } = useTranslation();
    const router = useRouter()

    const isUpdate = !!course;
    const form = useForm<CourseFormData>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: {
            name: course?.name ?? "",
            description: course?.description,
            image: course?.image,
        },
    });

    const trpcUtils = api.useUtils()
    const updateCourse = api.coursesRouter.update.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.courseSheet.updateSuccess"));
            router.refresh()
        }
    });
    const createCourse = api.coursesRouter.create.useMutation({
        onError: ({ message }) => toast.error(message),
        onSuccess: async (_, input) => {
            form.reset(input);
            props.onOpenChange?.(false);
            toast.success(t("content.courseSheet.createSuccess"));
            router.refresh()
        }
    });

    function onSubmit(input: CourseFormData) {
        if (isUpdate && course) {
            updateCourse.mutate({
                ids: [course.id],
                ...input,
            });
        } else {
            createCourse.mutate(input);
        }
    }

    return (
        <Sheet {...props}>
            <SheetContent className="flex flex-col gap-6 sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle>
                        {isUpdate ? t("content.courseSheet.updateTitle") : t("content.courseSheet.createTitle")}
                    </SheetTitle>
                    <SheetDescription>
                        {isUpdate ? t("content.courseSheet.updateDescription") : t("content.courseSheet.createDescription")}
                    </SheetDescription>
                </SheetHeader>
                <CourseForm<CourseFormData> form={form} onSubmit={onSubmit} courseId={course?.id}>
                    <SheetFooter className="gap-2 pt-2 sm:space-x-0">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">
                                {t("content.courseSheet.cancel")}
                            </Button>
                        </SheetClose>
                        <SpinnerButton
                            type="submit"
                            text={isUpdate ? t("content.courseSheet.save") : t("content.courseSheet.create")}
                            icon={SaveIcon}
                            isLoading={updateCourse.isPending || createCourse.isPending}
                        />
                    </SheetFooter>
                </CourseForm>
            </SheetContent>
        </Sheet>
    );
}
