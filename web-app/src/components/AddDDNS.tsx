import * as React from 'react';
import { useSnackbar } from 'notistack';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, Grid, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { Add } from '@mui/icons-material';

import { useCreateDDNS, useGetDDNS, useGetDomainRecords, useGetDomains } from '../lib';
import { LoadingButton } from '@mui/lab';
import { Domain, Record, Type } from '../types';

export default function AddDDNS() {
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [domain, setDomain] = React.useState<Domain | undefined>();
	const [record, setRecord] = React.useState<Record | undefined>();

	const { data: ddnss } = useGetDDNS();

	const { data: domains } = useGetDomains();
	const { data: records } = useGetDomainRecords(domain!);

	React.useEffect(() => {
		setRecord(undefined);
	}, [domain]);

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setDomain(undefined);
		setRecord(undefined);

		setOpen(false);
	};

	const createDDNS = useCreateDDNS();
	const handleCreate = async () => {
		createDDNS
			.mutateAsync({ domain: domain!, recordID: record?.id! })
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to add ddns (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	return (
		<>
			<Fab color='primary' aria-label='download' sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={handleOpen}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
				<DialogTitle>Add Record to DDNS</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<DialogContentText>DNS records will be updated when your public IP changes.</DialogContentText>
						</Grid>
						<Grid item xs={12}>
							<FormControl fullWidth>
								<InputLabel>Domain</InputLabel>
								<Select
									label='Domain'
									value={domain}
									onChange={(e) => {
										if (domains) setDomain(domains.find((d) => d.zoneID === e.target.value));
									}}
								>
									{domains?.map((d) => (
										<MenuItem key={d.zoneID} value={d.zoneID}>
											{d.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<FormControl fullWidth disabled={records?.length === 0 || !domain}>
								<InputLabel>Record</InputLabel>
								<Select
									label='Record'
									value={record}
									onChange={(e) => {
										if (records) setRecord(records?.find((r) => r.id === e.target.value));
									}}
								>
									{records
										?.filter((r) => r.type === Type.A)
										.filter((r) => !ddnss?.find((d) => d.recordID === r.id))
										.map((r) => (
											<MenuItem key={r.id} value={r.id}>
												{r.name.replace(`.${domain?.name}`, '')}
											</MenuItem>
										))}
								</Select>
							</FormControl>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Stack direction='row' spacing={1}>
						<Button color='inherit' onClick={handleClose}>
							Cancel
						</Button>
						<LoadingButton color='primary' variant='contained' onClick={handleCreate} startIcon={<Add />} disabled={!domain?.zoneID || !record?.id}>
							Add
						</LoadingButton>
					</Stack>
				</DialogActions>
			</Dialog>
		</>
	);
}
