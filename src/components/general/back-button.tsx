"use client"

import { useTranslation } from '@/i18n/useTranslation'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeftFromLineIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import WrapWithTooltip from '@/components/general/wrap-with-tooltip'

export default function BackButton() {
    const { t, isRtl } = useTranslation()
    const { back } = useRouter()

    return (
        <WrapWithTooltip text={t("common.back")}>
            <Button variant="ghost" size="icon" onClick={() => back()} className={cn(isRtl ? 'border-l rounded-l-none' : "border-r rounded-r-none")}>
                <ArrowLeftFromLineIcon />
            </Button>
        </WrapWithTooltip>
    )
}
