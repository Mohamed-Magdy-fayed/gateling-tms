import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-display font-bold text-foreground text-xl",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" />
      </span>
      Gateling
    </Link>
  );
}
