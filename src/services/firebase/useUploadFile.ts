import { useState, useCallback } from "react";
import {
    listFiles as listFilesInner,
    getFileDownloadURL as getFileDownloadURLInner,
    fileExists as fileExistsInner,
    uploadFile as uploadFileInner,
    copyFile as copyFileInner,
    copyFiles as copyFilesInner,
    moveFile as moveFileInner,
    moveFiles as moveFilesInner,
    deleteFile as deleteFileInner,
    deleteFiles as deleteFilesInner,
} from "./actions";

export function useFirebase() {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const reset = useCallback(() => {
        setProgress(0);
        setLoading(false);
        setError(null);
        setUploadedUrl(null);
    }, []);

    // Generic wrapper to handle loading and error states
    const wrap = useCallback(
        <T extends any[], R>(
            fn: (...args: T) => Promise<R>,
            opts: { affectsUrl?: boolean; affectsProgress?: boolean } = {}
        ) => {
            return async (...args: T): Promise<R> => {
                setLoading(true);
                setError(null);
                if (opts.affectsProgress) setProgress(0);
                if (opts.affectsUrl) setUploadedUrl(null);
                try {
                    const result = await fn(...args);
                    if (opts.affectsUrl && typeof result === "string") setUploadedUrl(result);
                    return result;
                } catch (err) {
                    setError(String(err));
                    throw err;
                } finally {
                    setLoading(false);
                }
            };
        },
        []
    );

    // Special case for uploadFile to handle progress
    const uploadFile = useCallback(
        async (
            storagePath: string,
            file: Blob | Uint8Array | ArrayBuffer,
            onProgress?: (pct: number) => void
        ) => {
            setLoading(true);
            setProgress(0);
            setError(null);
            try {
                const url = await uploadFileInner(
                    storagePath,
                    file,
                    (pct) => {
                        setProgress(pct);
                        onProgress?.(pct);
                    }
                );
                setUploadedUrl(url);
                return url;
            } catch (err) {
                setError(String(err));
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return {
        progress,
        loading,
        error,
        uploadedUrl,
        reset,
        uploadFile,
        copyFile: wrap(copyFileInner),
        copyFiles: wrap(copyFilesInner),
        moveFile: wrap(moveFileInner),
        moveFiles: wrap(moveFilesInner),
        deleteFile: wrap(deleteFileInner),
        deleteFiles: wrap(deleteFilesInner),
        listFiles: wrap(listFilesInner),
        getFileDownloadURL: wrap(getFileDownloadURLInner),
        fileExists: wrap(fileExistsInner),
    };
}
