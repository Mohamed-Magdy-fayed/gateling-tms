import { SessionAttendancePage } from "@/features/system/live-classes/attendance/admin";

export default async function SessionAttendanceRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
      <SessionAttendancePage sessionId={id} />
  );
}
