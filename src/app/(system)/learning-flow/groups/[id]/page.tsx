import { GroupDetailPage } from "@/features/system/learning-flow/groups/admin";

export default async function GroupDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto px-4 py-8">
      <GroupDetailPage groupId={id} />
    </div>
  );
}
