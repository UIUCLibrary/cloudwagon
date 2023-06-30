import IconButton from '@mui/material/IconButton';
import SyncIcon from '@mui/icons-material/Sync';
import MenuItem from '@mui/material/MenuItem';

export interface MenuAction {
  onTriggered: ()=>void
}

export const RefreshDirectoryAction = ({onTriggered}: MenuAction) => {
  return (
    <IconButton edge={'start'} onClick={onTriggered}>
      <SyncIcon/>
    </IconButton>
    )
}

export const CreateNewDirectoryAction = ({onTriggered}: MenuAction) => {
  return (
    <MenuItem
        onClick={() => onTriggered()}
    >
      New Directory
    </MenuItem>
  )
}