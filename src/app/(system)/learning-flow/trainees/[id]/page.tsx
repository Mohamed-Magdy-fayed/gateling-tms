import { TraineeDetailPage } from "@/features/system/learning-flow/trainees/admin";

export default async function TraineeDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
      <TraineeDetailPage traineeId={id} />
  );
}
