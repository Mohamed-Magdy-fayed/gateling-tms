import { CourseDetailPage } from "@/features/system/content-library/courses/admin";

export default async function CourseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CourseDetailPage courseId={id} />
    </div>
  );
}
