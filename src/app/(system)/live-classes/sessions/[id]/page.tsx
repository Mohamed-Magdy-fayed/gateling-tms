import { SessionAttendancePage } from "@/features/system/live-classes/attendance/admin";

export default async function SessionAttendanceRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto px-4 py-8">
      <SessionAttendancePage sessionId={id} />
    </div>
  );
}
