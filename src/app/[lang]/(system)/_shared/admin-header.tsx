import { DarkModeSwitcher } from "@/components/dark-mode-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AdminHeader({ title, actions }: { title?: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <header className="flex items-center gap-2 p-4">
            {title}
            <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-4">
                <DarkModeSwitcher />
                <LanguageSwitcher />
                {actions}
            </div>
        </header>
    )
}
