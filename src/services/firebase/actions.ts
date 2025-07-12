import { ref, deleteObject, getDownloadURL, uploadBytes, uploadBytesResumable, listAll } from "firebase/storage"
import { storage } from "./config"

export async function listFiles(path: string): Promise<string[]> {
    const dirRef = ref(storage, path)
    const res = await listAll(dirRef)
    return res.items.map(itemRef => itemRef.fullPath)
}

export async function getFileDownloadURL(path: string): Promise<string> {
    const fileRef = ref(storage, path)
    return getDownloadURL(fileRef)
}

export async function fileExists(path: string): Promise<boolean> {
    const fileRef = ref(storage, path)
    try {
        await getDownloadURL(fileRef)
        return true
    } catch (error: any) {
        if (error.code === "storage/object-not-found") {
            return false
        }
        throw error
    }
}

export async function uploadFile(
    path: string,
    file: Blob | Uint8Array | ArrayBuffer,
    onProgress?: (progress: number) => void
): Promise<string> {
    if (await fileExists(path)) {
        throw new Error("File already exists at this path.")
    }

    const fileRef = ref(storage, path)
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(fileRef, file)
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                if (onProgress) {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    onProgress(progress)
                }
            },
            (error) => reject(error),
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref)
                resolve(url)
            }
        )
    })
}

export async function copyFile(sourcePath: string, destinationPath: string) {
    const sourceRef = ref(storage, sourcePath)
    const destRef = ref(storage, destinationPath)
    const url = await getDownloadURL(sourceRef)
    const response = await fetch(url)
    const blob = await response.blob()
    await uploadBytes(destRef, blob)
}

export async function copyFiles(sourceDestPairs: { source: string; dest: string }[]) {
    await Promise.all(sourceDestPairs.map(({ source, dest }) => copyFile(source, dest)))
}

export async function moveFile(sourcePath: string, destinationPath: string) {
    await copyFile(sourcePath, destinationPath)
    await deleteFile(sourcePath)
}

export async function moveFiles(sourceDestPairs: { source: string; dest: string }[]) {
    await Promise.all(sourceDestPairs.map(({ source, dest }) => moveFile(source, dest)))
}

export async function deleteFile(path: string) {
    const fileRef = ref(storage, path)
    await deleteObject(fileRef)
}

export async function deleteFiles(paths: string[]) {
    await Promise.all(paths.map(deleteFile))
}

export function getStoragePathFromUrl(url: string): string | null {
    try {
        const match = url.match(/\/o\/(.+?)\?/);
        if (!match?.[1]) return null;
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}
