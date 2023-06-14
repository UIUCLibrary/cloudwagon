import {StreamApiData} from '../stream.types'
export interface JobStreamState {
  streamOpen: boolean,
  errors: string[]
  data: StreamApiData[]

}