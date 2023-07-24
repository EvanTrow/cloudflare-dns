import * as React from 'react';
import { useSnackbar } from 'notistack';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, TextField } from '@mui/material';
import { Delete, Edit, MoreVert, Save } from '@mui/icons-material';

import { useUpsertDomain, useDeleteDomain } from '../lib';
import { Domain } from '../types';
import { LoadingButton } from '@mui/lab';
import { isValidDomain } from './AddDomain';

type DomainMenuProps = {
	domain: Domain;
};

export default function DomainMenu({ domain }: DomainMenuProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

	const [domainName, setDomainName] = React.useState('');
	const [zoneID, setZoneID] = React.useState('');
	const [apiToken, setApiToken] = React.useState('');

	const upsertDomain = useUpsertDomain();
	const handleUpsert = async () => {
		upsertDomain
			.mutateAsync({ zoneID: zoneID, apiToken: apiToken })
			.then(() => {
				handleClose();
				handleCloseDialog();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to add domain! ${err.message}`, { variant: 'error' });
			});
	};

	const handleOpen = () => {
		setDomainName(domain.name);
		setZoneID(domain.zoneID);
		setApiToken(domain.apiToken);

		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDomainName('');
		setZoneID('');
		setApiToken('');

		setDialogOpen(false);
	};

	const deleteDomain = useDeleteDomain();
	const handleDeleteDomain = () => {
		deleteDomain
			.mutateAsync(domain.zoneID)
			.then(() => {
				handleClose();
				setConfirmDeleteOpen(false);
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to delete domain! ${err.message}`, { variant: 'error' });
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
						handleOpen();
						handleClose();
					}}
				>
					<ListItemIcon>
						<Edit fontSize='small' />
					</ListItemIcon>
					<ListItemText>Edit</ListItemText>
				</MenuItem>
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

			<Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth='sm'>
				<DialogTitle>Edit {domain.name}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Edit domain details.</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Domain Name' variant='outlined' value={domainName} disabled autoFocus />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Zone ID' variant='outlined' value={zoneID} disabled />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='API Token' variant='outlined' value={apiToken} onChange={(e) => setApiToken(e.target.value)} type='password' />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleCloseDialog}>
						Cancel
					</Button>

					<LoadingButton
						color='primary'
						variant='contained'
						onClick={handleUpsert}
						startIcon={<Save />}
						loading={upsertDomain.isLoading}
						disabled={!isValidDomain(domainName) || zoneID.length !== 32 || apiToken.length < 10}
					>
						Save
					</LoadingButton>
				</DialogActions>
			</Dialog>

			<Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
				<DialogTitle>Remove {domain.name}?</DialogTitle>
				<DialogContent>
					<DialogContentText>Are you sure you want to remove this domain?</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => setConfirmDeleteOpen(false)}>
						Cancel
					</Button>
					<LoadingButton onClick={() => handleDeleteDomain()} endIcon={<Delete />} color='error' loading={deleteDomain.isLoading} loadingPosition='end' variant='contained'>
						Yes, Remove it
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
