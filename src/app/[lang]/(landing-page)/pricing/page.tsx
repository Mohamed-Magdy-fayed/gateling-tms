import PlansClient from '@/features/plans/plans-client';
import { Suspense } from 'react';

export default function PricingPage() {
    return (
        <Suspense>
            <PlansClient />
        </Suspense>
    )
}
