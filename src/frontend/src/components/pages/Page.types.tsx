
export type MessageStatusLevel = "info" | "error" | "success"
export interface StatusMessage{

    message: string;
    level: MessageStatusLevel;
}

export interface PageProps{
    onStatusMessage? : (message: string, level?: MessageStatusLevel) => void
}
