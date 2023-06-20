import {useState} from "react";
import axios from "axios";

export const useUploadFiles = (
    path: string | null,
)=>{
    const [error, setError] = useState("");
    const [progress, setProgress] = useState<null | number>(null);
    const upload = (files: File[]) =>{
        const formData = new FormData();
        for (const file of files) {
            formData.append("files", file, file.name);
        }
        return axios.post(`/api/files?path=${path}`, formData)

    }
    return {progress, error, upload}
}