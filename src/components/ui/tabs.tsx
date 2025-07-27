"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/useTranslation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function Tabs({
  className,
  defaultValue,
  id,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const { isRtl } = useTranslation()
  const [activeTab, setActiveTab] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const storedTab = sessionStorage.getItem(`activeTab${id}`);
    setActiveTab(storedTab || defaultValue);
  }, [defaultValue]);

  const handleValueChange = (value: string) => {
    sessionStorage.setItem(`activeTab${id}`, value);
    setActiveTab(value);
  };

  return (
    <TabsPrimitive.Root
      dir={isRtl ? "rtl" : "ltr"}
      data-slot="tabs"
      value={activeTab}
      onValueChange={handleValueChange}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground flex-wrap inline-flex w-fit items-center justify-center rounded-lg p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-primary data-[state=active]:text-background dark:data-[state=active]:text-foreground hover:border-primary/50 hover:bg-primary/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring data-[state=active]:border-primary dark:data-[state=active]:bg-primary/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
