import { Suspense } from "react";
import { LiveClassesPage } from "@/features/system/live-classes/sessions/admin";

// `useSearchParams` in the page needs a Suspense boundary above it, or the
// whole route bails out of static rendering with a build error.
export default function LiveClassesSessionsPage() {
  return (
    <Suspense>
      <LiveClassesPage />
    </Suspense>
  );
}
