import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-display font-bold text-foreground text-xl",
        className,
      )}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={32}
        height={32}
        className="size-8"
        priority={priority}
      />
      Gateling
    </Link>
  );
}
