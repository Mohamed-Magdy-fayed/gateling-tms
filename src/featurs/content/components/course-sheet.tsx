"use client"

import { Button, SpinnerButton } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet'
import CourseForm from '@/featurs/content/components/course-form';
import { courseFormSchema, type CourseFormData } from '@/featurs/content/schema';
import { useTranslation } from '@/i18n/useTranslation';
import type { Course } from '@/server/db/schema';
import { api } from '@/trpc/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function CourseSheet({ course }: { course?: Course }) {
    const [isOpen, setIsOpen] = useState(false)
    const { t, isRtl } = useTranslation()

    const title = !course ? t("content.courseForm.new") : t("content.courseForm.update")
    const description = !course ? t("content.courseForm.formDescription") : t("content.courseForm.formDescriptionUpdate")

    const form = useForm<CourseFormData>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: course
            ? course
            : {
                name: "",
                description: "",
                image: "",
            }
    });

    const createMutation = api.coursesRouter.create.useMutation({
        onSuccess: ({ name }) => {
            toast.success(t("content.courseForm.createdSuccess", { name }))
            setIsOpen(false)
        },
        onError: ({ message }) => toast.error(message),
    });

    function onSubmit(data: CourseFormData) {
        // course
        //     ? await updateCourse(course.id, data)
        //     : await createCourse(data);
        createMutation.mutate(data)
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button>
                    <PlusIcon />
                    {t("content.courseForm.new")}
                </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? 'left' : "right"}>
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <CourseForm form={form} onSubmit={onSubmit}>
                    <SheetFooter className='p-0'>
                        <div className='grid grid-cols-2 gap-2'>
                            <Button
                                disabled={createMutation.isPending}
                                onClick={() => setIsOpen(false)}
                                type="button"
                                variant="destructive"
                            >
                                {t("content.courseForm.cancel")}
                            </Button>
                            <Button
                                disabled={createMutation.isPending}
                                type="reset"
                                onClick={() => form.reset()}
                                variant="secondary"
                            >
                                {t("content.courseForm.reset")}
                            </Button>
                        </div>
                        <SpinnerButton
                            type="submit"
                            text={course ? t("content.courseForm.update") : t("content.courseForm.create")}
                            icon={SaveIcon}
                            isLoading={createMutation.isPending}
                        />
                    </SheetFooter>
                </CourseForm>
            </SheetContent>
        </Sheet>
    )
}
