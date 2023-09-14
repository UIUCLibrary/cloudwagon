import {BreadCrumbComponentProps} from "../../widgets/FileManager";
import {Link as RouterLink} from "react-router-dom";

export default function BreadCrumbRouteLink({path, display, onClick}: BreadCrumbComponentProps) {
    return (
        <RouterLink
            to={`/manageFiles/?path=${path}`}
            style={{textDecoration: 'none'}}
            onClick={()=> onClick(path)}
        >{display}</RouterLink>
    )
}
