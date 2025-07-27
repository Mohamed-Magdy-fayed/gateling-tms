import React, { createContext, useContext, useState, useCallback } from "react";

type ProgressContextType = {
    progress: number;
    setProgress: (value: number) => void;
    startProgress: (duration?: number) => void;
    cancelProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
    const [progress, setProgress] = useState(0);
    const animationRef = React.useRef<number | null>(null);

    // Fills progress to 100 over duration ms
    const startProgress = useCallback((duration = 3000) => {
        setProgress(0);
        const start = Date.now();
        const animate = () => {
            const elapsed = Date.now() - start;
            const percent = Math.min((elapsed / duration) * 100, 100);
            setProgress(percent);
            if (percent < 100) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                animationRef.current = null;
            }
        };
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(animate);
    }, []);

    // Cancel and set progress to 100 immediately
    const cancelProgress = useCallback(() => {
        setProgress(100);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }, []);

    return (
        <ProgressContext.Provider value={{ progress, setProgress, startProgress, cancelProgress }}>
            {children}
        </ProgressContext.Provider>
    );
};

export const useProgress = () => {
    const ctx = useContext(ProgressContext);
    if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
    return ctx;
};
