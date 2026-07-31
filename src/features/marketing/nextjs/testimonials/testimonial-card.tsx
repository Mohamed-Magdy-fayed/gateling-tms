import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { PublicTestimonial } from "@/features/marketing/testimonials/server";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  testimonial: PublicTestimonial;
  /** `feature` is the large orange treatment used for the lead quote. */
  tone?: "feature" | "plain";
};

function initialsOf(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function TestimonialCard({
  testimonial,
  tone = "plain",
}: TestimonialCardProps) {
  const isFeature = tone === "feature";

  return (
    <Card
      className={cn(
        "relative overflow-hidden px-8 py-10 sm:px-12 sm:py-12",
        isFeature && "bg-gradient-to-br from-orange-500 to-orange-600",
      )}
    >
      {isFeature && (
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-20 size-72 rounded-full bg-white/10 blur-3xl"
        />
      )}
      <figure className="relative max-w-2xl">
        <blockquote
          className={cn(
            "font-display font-semibold leading-snug",
            isFeature
              ? "text-2xl text-white sm:text-3xl"
              : "text-foreground text-xl",
          )}
        >
          {`“${testimonial.quote}”`}
        </blockquote>
        <figcaption className="mt-7 flex items-center gap-3">
          <Avatar
            className={cn("size-11", isFeature && "border-2 border-white/30")}
          >
            <AvatarImage
              src={testimonial.imageUrl ?? undefined}
              alt={testimonial.authorName}
            />
            <AvatarFallback
              className={cn(isFeature && "bg-white/20 text-white")}
            >
              {initialsOf(testimonial.authorName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div
              className={cn(
                "font-bold text-sm",
                isFeature ? "text-white" : "text-foreground",
              )}
            >
              {testimonial.authorName}
            </div>
            <div
              className={cn(
                "text-xs",
                isFeature ? "text-orange-100" : "text-muted-foreground",
              )}
            >
              {testimonial.authorRole
                ? `${testimonial.authorRole} · ${testimonial.academyName}`
                : testimonial.academyName}
            </div>
          </div>
        </figcaption>
      </figure>
    </Card>
  );
}
