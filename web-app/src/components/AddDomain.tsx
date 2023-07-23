import * as React from 'react';
import { useSnackbar } from 'notistack';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, TextField } from '@mui/material';
import { Add, Publish } from '@mui/icons-material';

import { useImportDomains, useUpsertDomain } from '../lib';
import { LoadingButton } from '@mui/lab';

export default function AddDomain() {
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [importOpen, setImportOpen] = React.useState(false);

	const [zoneID, setZoneID] = React.useState('');
	const [apiToken, setApiToken] = React.useState('');

	const upsertDomain = useUpsertDomain();
	const handleCreate = async () => {
		upsertDomain
			.mutateAsync({ zoneID: zoneID, apiToken: apiToken })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to add domain (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	const importDomains = useImportDomains();
	const handleImport = async () => {
		importDomains
			.mutateAsync(apiToken)
			.then(() => {
				handleCloseImport();
				handleClose();
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to import domains (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setZoneID('');
		setApiToken('');

		setOpen(false);
	};

	const handleCloseImport = () => {
		setApiToken('');

		setImportOpen(false);
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
							<TextField fullWidth label='Zone ID' variant='outlined' value={zoneID} onChange={(e) => setZoneID(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='API Token' variant='outlined' value={apiToken} onChange={(e) => setApiToken(e.target.value)} type='password' />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Grid container>
						<Grid item xs>
							<Button
								color='info'
								variant='outlined'
								onClick={() => {
									setImportOpen(true);
								}}
								startIcon={<Publish />}
							>
								Import Domains
							</Button>
						</Grid>
						<Grid item>
							<Stack direction='row' spacing={1}>
								<Button color='inherit' onClick={handleClose}>
									Cancel
								</Button>
								<LoadingButton
									color='primary'
									variant='contained'
									onClick={handleCreate}
									startIcon={<Add />}
									loading={upsertDomain.isLoading}
									disabled={zoneID.length !== 32 || apiToken.length === 0}
								>
									Add
								</LoadingButton>
							</Stack>
						</Grid>
					</Grid>
				</DialogActions>
			</Dialog>

			<Dialog open={importOpen} onClose={handleCloseImport} fullWidth maxWidth='sm'>
				<DialogTitle>Import Domains</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>Import all domains available to your API token.</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label='API Token' variant='outlined' value={apiToken} onChange={(e) => setApiToken(e.target.value)} type='password' />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Stack direction='row' spacing={1}>
						<Button color='inherit' onClick={handleCloseImport}>
							Cancel
						</Button>
						<LoadingButton color='primary' variant='contained' onClick={handleImport} startIcon={<Publish />} loading={importDomains.isLoading} disabled={apiToken.length === 0}>
							Import
						</LoadingButton>
					</Stack>
				</DialogActions>
			</Dialog>
		</>
	);
}

export function isValidDomain(domain: string): boolean {
	if (!domain) return false;
	return /^[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,20}?$/.test(domain);
}
