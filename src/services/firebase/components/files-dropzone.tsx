"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File } from 'lucide-react';

interface FileDropzoneProps {
    onFilesChange?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface FileWithPreview extends File {
    preview?: string;
}

export default function FileDropzone({
    onFilesChange,
    accept = "*/*",
    multiple = true,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    disabled = false,
    className = "",
    children
}: FileDropzoneProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): string | null => {
        if (maxSize && file.size > maxSize) {
            return `File "${file.name}" is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
        }

        if (accept !== "*/*") {
            const acceptedTypes = accept.split(',').map(type => type.trim());
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            const mimeType = file.type;

            const isAccepted = acceptedTypes.some(acceptedType => {
                if (acceptedType.startsWith('.')) {
                    return fileExtension === acceptedType.toLowerCase();
                }
                if (acceptedType.includes('*')) {
                    const baseType = acceptedType.split('/')[0];
                    if (!baseType) return false;
                    return mimeType.startsWith(baseType);
                }
                return mimeType === acceptedType;
            });

            if (!isAccepted) {
                return `File "${file.name}" is not an accepted file type`;
            }
        }

        return null;
    }, [accept, maxSize]);

    const processFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const validFiles: FileWithPreview[] = [];
        let errorMessage = "";

        // Check total file count
        if (!multiple && fileArray.length > 1) {
            errorMessage = "Only one file is allowed";
            setError(errorMessage);
            return;
        }

        if (files.length + fileArray.length > maxFiles) {
            errorMessage = `Maximum ${maxFiles} files allowed`;
            setError(errorMessage);
            return;
        }

        // Validate each file
        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                errorMessage = validationError;
                break;
            }

            // Create preview for image files
            const fileWithPreview = file as FileWithPreview;
            if (file.type.startsWith('image/')) {
                fileWithPreview.preview = URL.createObjectURL(file);
            }

            validFiles.push(fileWithPreview);
        }

        if (errorMessage) {
            setError(errorMessage);
            return;
        }

        setError("");
        const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
    }, [files, multiple, maxFiles, validateFile, onFilesChange]);

    const removeFile = useCallback((index: number) => {
        const fileToRemove = files[index];
        if (!fileToRemove) return;
        if (fileToRemove.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }

        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles);
    }, [files, onFilesChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            processFiles(droppedFiles);
        }
    }, [disabled, processFiles]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            processFiles(selectedFiles);
        }
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles]);

    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Clean up object URLs on unmount
    React.useEffect(() => {
        return () => {
            files.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, []);

    return (
        <div className={`w-full ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Dropzone area */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
                    }
          ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }
        `}
            >
                {children ? (
                    children
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Upload className={`w-12 h-12 ${isDragOver ? 'text-orange-500' : 'text-stone-400'}`} />
                        <div>
                            <p className="text-lg font-medium text-stone-700 dark:text-stone-300">
                                {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
                            </p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                                {accept !== "*/*" && `Accepted formats: ${accept}`}
                                {maxSize && ` • Max size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`}
                                {multiple && ` • Max files: ${maxFiles}`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        Selected Files ({files.length})
                    </h4>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {file.preview ? (
                                        <img
                                            src={file.preview}
                                            alt={file.name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <File className="w-10 h-10 text-stone-400 flex-shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="ml-2 p-1 text-stone-400 hover:text-red-500 transition-colors"
                                    disabled={disabled}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}