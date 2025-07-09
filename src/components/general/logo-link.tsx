import { APP_CONFIG } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { H3 } from "@/components/ui/typography";

export default function LogoLink() {
    return (
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
            <Image src="/logo.png" alt="Logo" height={500} width={500} className='w-8 h-8 rounded-md' />
            <H3>{APP_CONFIG.name}</H3>
        </Link>
    )
}
