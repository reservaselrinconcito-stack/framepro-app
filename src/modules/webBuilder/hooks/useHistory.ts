import { useState, useCallback, useMemo } from 'react';

export function useHistory<T>(initialState: T) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = useMemo(() => history[currentIndex], [history, currentIndex]);

    const set = useCallback((newState: T) => {
        if (newState === history[currentIndex]) return;
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, history.length]);

    const reset = useCallback((newState: T) => {
        setHistory([newState]);
        setCurrentIndex(0);
    }, []);

    return {
        state,
        set,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        reset,
    };
}
