export interface UseSSEHookData<T> {
    data: T;
    loading: boolean;
    error: unknown;
    isOpen: boolean;
    stop: ()=>void;
    reset: ()=>void
}