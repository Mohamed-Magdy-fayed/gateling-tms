"use client";

import {
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    useEffect,
    useRef,
    useState
} from "react";
import { Button } from "@/components/ui/button";
import { ImageOff, ImagePlus, Trash } from "lucide-react";
import { type StorageReference, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { cn } from "@/lib/utils";
import { storage } from "../config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@radix-ui/react-progress";
import { useTranslation } from "@/i18n/useTranslation";

interface ImageUploaderProps {
    disabled?: boolean;
    value?: string;
    folder?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    onLoading?: Dispatch<SetStateAction<boolean>>;
    customeImage?: ReactNode;
    customeButton?: ReactNode;
    noPadding?: boolean;
}

export default function ImageUploader({
    onChange,
    onRemove,
    onLoading,
    value,
    folder = "temp",
    disabled,
    customeImage,
    customeButton,
    noPadding
}: ImageUploaderProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleImageChange = async (file: File) => {
        const filename = file.name;
        const storageRef = ref(
            storage,
            `${folder}/${filename}`
        );

        const uploadTask = new Promise<StorageReference>((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, file);

            task.on('state_changed',
                ({ bytesTransferred, totalBytes }) => setProgress(bytesTransferred / totalBytes * 100),
                (error) => reject(error),
                () => resolve(task.snapshot.ref),
            );
        });

        try {
            setLoading(true)
            onLoading?.(true)
            const snapshotRef = await uploadTask;
            const downloadURL = await getDownloadURL(snapshotRef);
            onChange(downloadURL)
            setProgress(0)
            setLoading(false)
            onLoading?.(false)
        } catch (error) {
            setLoading(false)
            onLoading?.(false)
            throw new Error(`Error uploading file: ${error}`);
        }
    };

    if (!isMounted) return null;

    return (
        <div className={cn("flex items-center justify-between gap-4 py-4 w-full", noPadding && "py-0")}>
            {value && value.length > 0 ? (
                <div className="flex gap-4 rounded-md items-center">
                    {customeImage ? customeImage : (
                        <div className="relative grid justify-items-center items-center">
                            <Avatar className="w-20 h-20">
                                <AvatarImage alt="image" src={value} />
                                <AvatarFallback>
                                    <Skeleton className="w-full h-full rounded-full" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                </div>
            ) : customeImage ? customeImage : (
                <div className="rounded-md w-20 h-20">
                    <Skeleton className="w-full h-full rounded-full grid place-content-center">
                        <ImageOff></ImageOff>
                    </Skeleton>
                </div>
            )}
            <Input
                disabled={disabled}
                onChange={(e) => handleImageChange(e.target.files![0]!)}
                type="file"
                accept="image/*"
                className="hidden"
                ref={inputRef}
            />
            <div className="flex flex-col items-end gap-2">
                {onRemove && value && value.length > 0 ? (
                    <div className="flex items-center rtl:flex-row-reverse">
                        <Button
                            type="button"
                            variant={"destructive"}
                            onClick={() => {
                                onRemove()
                                if (!inputRef.current) return
                                inputRef.current.value = ""
                            }}
                            className="rounded-r-none"
                        >
                            <Trash className="h-4 w-4 text-error" />
                        </Button>
                        <Button
                            type="button"
                            disabled={disabled || loading}
                            variant="outline"
                            onClick={() => inputRef.current?.click()}
                            className={cn("relative overflow-hidden rounded-l-none")}
                        >
                            {customeButton ? customeButton : (
                                <>
                                    {progress > 0 && <Progress value={progress} className="absolute h-full rounded-none opacity-40" />}
                                    <ImagePlus className={cn("mr-2 h-4 w-4")} />
                                    <span>{t("uploadImage.dialogTitle")}</span>
                                </>
                            )}
                        </Button>
                    </div>
                ) :
                    <Button
                        type="button"
                        disabled={disabled || loading}
                        variant="outline"
                        onClick={() => inputRef.current?.click()}
                        className={cn("relative overflow-hidden")}
                    >
                        {customeButton ? customeButton : (
                            <>
                                {progress > 0 && <Progress value={progress} className="absolute h-full rounded-none opacity-40" />}
                                <ImagePlus className={cn("mr-2 h-4 w-4")} />
                                <span className="whitespace-nowrap">{t("uploadImage.dialogTitle")}</span>
                            </>
                        )}
                    </Button>
                }
            </div>
        </div>
    );
};
