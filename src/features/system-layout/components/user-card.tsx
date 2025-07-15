import React, { type ComponentProps } from 'react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getInitials } from '@/features/system-layout/lib/utils'

export function UserCard({ className, ...props }: ComponentProps<"div">) {
    const user = useSession().data?.user

    if (!user) return <Skeleton className="w-full h-12" />

    const { name, email, image } = user

    return (
        <div className={cn("group/user-card flex items-center gap-2 text-left text-sm", className)} {...props}>
            <Avatar className="h-8 w-8 rounded-lg rtl:order-0">
                <AvatarImage src={image || undefined} alt={name ?? ""} />
                <AvatarFallback className="rounded-lg">{getInitials(name ?? "")}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight">
                <Link
                    href={email ? "/admin/users_management/account" : "/student/my_account"}
                    className="truncate font-semibold group-hover/user-card:text-primary"
                >
                    {name}
                </Link>
                <span className="truncate text-xs">{email}</span>
            </div>
        </div>
    )
}
