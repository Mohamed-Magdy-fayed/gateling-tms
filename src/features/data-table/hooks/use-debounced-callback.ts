/**
 * @see https://github.com/mantinedev/mantine/blob/master/packages/@mantine/hooks/src/use-debounced-callback/use-debounced-callback.ts
 */

import * as React from "react";

import { useCallbackRef } from "@/features/data-table/hooks/use-callback-ref";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
    callback: T,
    delay: number,
) {
    const handleCallback = useCallbackRef(callback);
    const debounceTimerRef = React.useRef(0);
    React.useEffect(
        () => () => window.clearTimeout(debounceTimerRef.current),
        [],
    );

    const setValue = React.useCallback(
        (...args: Parameters<T>) => {
            window.clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = window.setTimeout(
                () => handleCallback(...args),
                delay,
            );
        },
        [handleCallback, delay],
    );

    return setValue;
}
