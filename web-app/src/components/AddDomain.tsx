import * as React from 'react';
import { useSnackbar } from 'notistack';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField } from '@mui/material';
import { Add } from '@mui/icons-material';

import { useCreateDomain } from '../lib';

export default function AddDomain() {
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);

	const [domain, setDomain] = React.useState('');
	const [zoneID, setZoneID] = React.useState('');
	const [apiToken, setApiToken] = React.useState('');

	const createDomain = useCreateDomain();
	const handleCreate = async () => {
		createDomain
			.mutateAsync({ domain: domain, zoneID: zoneID, apiToken: apiToken })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to add domain! ${err.message}`, { variant: 'error' });
			});
	};

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setDomain('');
		setApiToken('');

		setOpen(false);
	};

	return (
		<>
			<List>
				<ListItem disablePadding>
					<ListItemButton onClick={handleOpen}>
						<ListItemIcon>
							<Add />
						</ListItemIcon>
						<ListItemText primary='Add Domain' />
					</ListItemButton>
				</ListItem>
			</List>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
				<DialogTitle>Add Domain</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Add a domain to manage DNS.</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Domain Name' variant='outlined' value={domain} onChange={(e) => setDomain(e.target.value)} autoFocus />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='Zone ID' variant='outlined' value={zoneID} onChange={(e) => setZoneID(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='API Token' variant='outlined' value={apiToken} onChange={(e) => setApiToken(e.target.value)} type='password' />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button color='primary' variant='contained' onClick={handleCreate} startIcon={<Add />}>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
