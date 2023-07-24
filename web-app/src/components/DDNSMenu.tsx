import * as React from 'react';
import { useSnackbar } from 'notistack';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { Delete, MoreVert } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { useDeleteDDNS } from '../lib';
import { DDNSResult } from '../types';

type RecordFormProps = {
	ddns: DDNSResult;
};
export default function DDNSMenu({ ddns }: RecordFormProps) {
	const { enqueueSnackbar } = useSnackbar();

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const deleteDomain = useDeleteDDNS();
	const handleDeleteDDNS = () => {
		deleteDomain
			.mutateAsync(ddns.id)
			.then(() => {
				handleClose();
				setConfirmDeleteOpen(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to delete ddns! ${err.message}`, { variant: 'error' });
			});
	};

	return (
		<>
			<IconButton edge='end' onClick={handleClick}>
				<MoreVert />
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
			>
				<MenuItem
					onClick={() => {
						setConfirmDeleteOpen(true);
						handleClose();
					}}
				>
					<ListItemIcon>
						<Delete fontSize='small' />
					</ListItemIcon>
					<ListItemText>Remove</ListItemText>
				</MenuItem>
			</Menu>

			<Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
				<DialogTitle>Remove {ddns.name}?</DialogTitle>
				<DialogContent>
					<DialogContentText>Are you sure you want to remove this DDNS record?</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => setConfirmDeleteOpen(false)}>
						Cancel
					</Button>
					<LoadingButton
						onClick={() => {
							handleDeleteDDNS();
						}}
						endIcon={<Delete />}
						color='error'
						loadingPosition='end'
						variant='contained'
					>
						Yes, Remove it
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
