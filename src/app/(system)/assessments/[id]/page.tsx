import { FormDetailPage } from "@/features/system/assessments/forms/admin";

export default async function AssessmentDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FormDetailPage formId={id} />
    </div>
  );
}
