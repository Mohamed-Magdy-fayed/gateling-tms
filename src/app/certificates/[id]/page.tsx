import { CertificatePrintView } from "@/features/system/learning-flow/certificates/admin";

// Deliberately outside the `(system)` route group: a certificate is a document
// to print, so it gets the root layout only — no sidebar, no app header. The
// route is still session-gated through `proxy.ts`'s protected prefixes.
export default async function CertificateRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CertificatePrintView certificateId={id} />;
}
