import {FC} from 'react';
import {splitRoutes} from '../FileManagement';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {IToolbar, IRoute} from './Widgets.types';

export const CurrentPath: FC<IToolbar> = ({selected, setPwd}) => {
  const breadcrumbs = selected ? splitRoutes(selected).map((route: IRoute, index) => {
    return <Link
        key={index}
        underline="hover"
        color="inherit"
        href={"#"}
        onClick={() => {
          setPwd(route.path)
        }}>{route.display}</Link>
  }) : <></>
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