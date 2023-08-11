import {PropsWithChildren} from "react";
import Paper from "@mui/material/Paper";
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import {styled} from "@mui/material/styles";
import TableCell, {tableCellClasses} from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";


const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));


type JobHeading = {
    label: string,
    minWidth: number
}

type JobQueueProps = {
    headings: JobHeading[]
}
export default function JobQueueTable(props: PropsWithChildren<JobQueueProps>) {
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow key={'header'}>
                        {
                            props.headings.map(
                                (column)=>(
                                    <StyledTableCell key={column.label} style={{minWidth: column.minWidth}}>
                                        {column.label}
                                    </StyledTableCell>
                                )
                            )
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.children}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

interface JobRowProps<T> {
    selected?: boolean;
    renderItem?: (key: string, item: T) => React.ReactNode;
    keyExtractor?: (key: string, item: T) => string;
    data: Record<string, T>
}
export const JobRow = <T extends unknown>({data, renderItem, keyExtractor, selected} : JobRowProps<T>):React.ReactElement =>{
    const contents: React.ReactNode[] = []
    for (const [k, v] of Object.entries(data)) {
        const key = keyExtractor? keyExtractor(k, v) : k
        const element = renderItem ? renderItem(key, v) : <TableCell key={key}>{v as string}</TableCell>
        contents.push( element)
    }
    return (<TableRow selected={selected}>{contents.map(element => element)}</TableRow>)
}