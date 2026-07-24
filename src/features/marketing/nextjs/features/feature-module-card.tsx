import { CheckIcon, type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

type FeatureModuleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: readonly string[];
  badge: string;
  isFree: boolean;
};

export function FeatureModuleCard({
  icon: Icon,
  title,
  description,
  bullets,
  badge,
  isFree,
}: FeatureModuleCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              isFree
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
          </span>
          <Tag color={isFree ? "green" : "neutral"}>{badge}</Tag>
        </div>
        <h3 className="mt-1 font-display font-semibold text-foreground text-lg">
          {title}
        </h3>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2 text-muted-foreground text-sm"
            >
              <CheckIcon className="size-4 shrink-0 text-primary" />
              {bullet}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
