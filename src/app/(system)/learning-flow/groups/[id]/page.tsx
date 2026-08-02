import { GroupDetailPage } from "@/features/system/learning-flow/groups/admin";

export default async function GroupDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
      <GroupDetailPage groupId={id} />
  );
}
