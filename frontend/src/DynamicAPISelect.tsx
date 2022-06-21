import React from "react";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

interface updateSelectionCallback {
    (workflowName: string, workflowId: number): void;
}

interface workflowItem {
    id: number,
    name: string
}

interface workflowSelectInterface {
    workflows: workflowItem[]
    onSelectChange?: updateSelectionCallback
}

function WorkflowSelect(props: workflowSelectInterface) {

    const [workflow, setWorkflow] = React.useState({name: '', id: 0});
    const handleChange = (event: SelectChangeEvent) => {
        const index = parseInt(event.target.value)
        const element = props.workflows[index]
        if (props.onSelectChange) {
            props.onSelectChange(element.name, element.id)
        }
        setWorkflow(element)
    };

    let workflows = props.workflows
    const options = workflows.map(
        (option, index) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
    )
    const value = options.length > 0 ? workflow.id.toString(): ""
    return (
        <FormControl fullWidth>
            <InputLabel id="select-workflow-label">Workflow</InputLabel>
            <Select
                labelId="select-workflow-label"
                id="select-workflow"
                value={value}
                label="Workflow"
                onChange={handleChange}
            >
                {options}
            </Select>
        </FormControl>
    );
}

export class DynamicAPISelect extends React.Component<any, any> {
    children: any[]
    apiUrl?: string
    onSelectChange?: updateSelectionCallback

    constructor(props: any) {
        super(props);
        this.apiUrl = props.apiUrl
        this.children = props.children
        this.state = {
            error: null,
            isLoaded: false,
            workflows: []
        };
        this.onSelectChange = props.onSelectChange
    }

    componentDidMount() {
        if (this.apiUrl) {
            fetch(this.apiUrl)
                .then(res => res.json())
                .then(
                    (result) => {
                        const data = result.workflows.sort()
                        this.setState({
                            isLoaded: true,
                            workflows:
                                data.map(
                                    (workflowName: string, index: number) => ({id: index, name: workflowName as string})
                                )
                        })
                    },
                    (error) => {
                        this.setState({isLoaded: true, error})
                    })
        }
        this.setState({isLoaded: true})

    }

    render() {

        const {error, isLoaded, workflows} = this.state;
        if (error) {
            return <React.Fragment>Error: {error.message}</React.Fragment>;
        } else if (!isLoaded) {
            return <React.Fragment>Loading...</React.Fragment>;
        }
        return (<React.Fragment>
            {this.children}
            {/*<WorkflowSelect3 workflows={workflows}/>*/}
            <WorkflowSelect workflows={workflows} onSelectChange={this.onSelectChange}/>
        </React.Fragment>)
    }
}