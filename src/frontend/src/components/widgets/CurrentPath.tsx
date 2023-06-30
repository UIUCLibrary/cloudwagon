import {splitRoutes} from './FileManager';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {IRoute} from './Widgets.types';

export default function CurrentPath({selected, onGotoParent}){
  const breadcrumbs = selected ? splitRoutes(selected).map((route: IRoute, index) => {
    return <Link
        key={index}
        underline="hover"
        color="inherit"
        href={"#"}
        onClick={() => {
          onGotoParent(route.path)
        }}>{route.display}</Link>
  }) : []
  return (
      <Box sx={{pb: 1, borderColor: 'text.disabled'}}>
        <Box aria-label={'working path'}
             sx={{pl: 1, minHeight: 28, border: "2px inset"}}>
          <Breadcrumbs separator={<NavigateNextIcon
              fontSize="small"/>}>{breadcrumbs}</Breadcrumbs>
        </Box>
      </Box>
  );
}