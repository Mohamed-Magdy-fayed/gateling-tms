"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LevelSheet } from "@/features/content/components/levels/level-sheet"
import { useTranslation } from "@/i18n/useTranslation"
import { ChevronDownIcon, PlusIcon, UploadCloudIcon, FilePlus2Icon, PackageCheckIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

type Action = "createLevel" | "uploadMaterial" | "createForm" | "quickOrder" | "delete"

export default function CourseActions() {
    const { t } = useTranslation()

    const [isOpen, setIsOpen] = useState(false)
    const [action, setAction] = useState<Action | null>(null)

    return (
        <>
            <LevelSheet
                open={action === "createLevel"}
                onOpenChange={(val) => !val && setAction(null)}
            />
            <DropdownMenu open={isOpen} onOpenChange={(val) => setIsOpen(val)}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-4">
                        {t("common.actions")}
                        <ChevronDownIcon className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => {
                            setIsOpen(false)
                            setAction("createLevel")
                        }}>
                            <PlusIcon />
                            {t("content.levelForm.create")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            setIsOpen(false)
                            setAction("uploadMaterial")
                        }}>
                            <UploadCloudIcon />
                            <span>Upload Material</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            setIsOpen(false)
                            setAction("createForm")
                        }}>
                            <FilePlus2Icon />
                            <span>Create a Form</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            setIsOpen(false)
                            setAction("quickOrder")
                        }}>
                            <PackageCheckIcon />
                            <span>Quick Order</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        setIsOpen(false)
                        setAction("delete")
                    }}
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    >
                        <Trash2Icon />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
