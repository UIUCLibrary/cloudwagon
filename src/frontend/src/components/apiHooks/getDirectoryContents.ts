import {IAPIDirectoryContents} from "../widgets";
import axios from "axios";

export class GetDirectoryContents{
    path: string
    constructor(path: string) {
        this.path = path
    }
    fetch(): Promise<IAPIDirectoryContents> {
        return axios.get(`/api/files/contents?path=${encodeURI(this.path)}`)
    }
}