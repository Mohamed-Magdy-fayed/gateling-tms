import { GetStartedForm } from "@/features/get-started/components/get-started-form";
import { Suspense } from "react";

export default function GetStartedPage() {
    return (
        <Suspense>
            <GetStartedForm />
        </Suspense>
    );
}
