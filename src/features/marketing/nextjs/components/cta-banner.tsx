import Link from "next/link";
import { Button } from "@/components/ui/button";

type CtaBannerProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  footnote?: string;
};

export function CtaBanner({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  footnote,
}: CtaBannerProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/60 blur-3xl dark:bg-orange-500/5"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display font-bold text-3xl text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" render={<Link href={ctaHref} />}>
            {ctaLabel}
          </Button>
        </div>
        {footnote ? (
          <p className="mt-4 text-muted-foreground text-xs">{footnote}</p>
        ) : null}
      </div>
    </section>
  );
}
