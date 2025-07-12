import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import { type ComponentProps } from "react"

export function LoadingSpinner({
    className,
    ...props
}: ComponentProps<typeof Loader2Icon>) {
    return (
        <div className="w-full h-full animate-spin flex items-center justify-center">
            <Loader2Icon
                className={cn("size-16", className)}
                {...props}
            />
        </div>
    )
}
