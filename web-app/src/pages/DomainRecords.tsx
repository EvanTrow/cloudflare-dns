import * as React from 'react';
import { useSnackbar } from 'notistack';
import prettyMilliseconds from 'pretty-ms';

import {
	Backdrop,
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	Link,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import { Add, Cloud, CloudOff, Delete, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import { useCreateDomainRecord, useDeleteDomainRecord, useGetDomainRecords, useUpdateDomainRecord, validRecord } from '../lib';
import { Domain, Record, Type } from '../types';

import RecordForm from '../components/RecordForm';

export type RecordRowProps = {
	domain: Domain;
	record: Record;
};
function RecordRow({ domain, record: origRecord }: RecordRowProps) {
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

	const [record, setRecord] = React.useState<Record>(origRecord);

	React.useEffect(() => {
		setRecord(record);
	}, [open, record]);

	const updateDomainRecord = useUpdateDomainRecord(domain);
	const handleUpdate = async () => {
		await updateDomainRecord
			.mutateAsync(record)
			.then(() => {
				setOpen(false);
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to update dns record (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	const deleteDomainRecord = useDeleteDomainRecord(domain);
	const handleDelete = async (recordID: string) => {
		await deleteDomainRecord
			.mutateAsync(recordID)
			.then(() => {
				setOpen(false);
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to delete dns record (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	return (
		<React.Fragment>
			<TableRow key={origRecord.id} sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} hover onClick={() => setOpen(!open)}>
				<TableCell component='th' scope='row'>
					{origRecord.type}
				</TableCell>
				<TableCell>
					{[Type.A, Type.CNAME].includes(origRecord.type) ? (
						<Link
							href={`http://${origRecord.name}`}
							underline='hover'
							color='inherit'
							target='_blank'
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							{origRecord.name.replace(`.${domain.name}`, '')}
						</Link>
					) : (
						origRecord.name.replace(`.${domain.name}`, '')
					)}
				</TableCell>
				<TableCell>
					{origRecord.content}
					{origRecord.priority ? (
						<Tooltip title={'Priority'} placement='top'>
							<Chip label={origRecord.priority} size='small' sx={{ ml: 1 }} />
						</Tooltip>
					) : (
						''
					)}
				</TableCell>
				<TableCell>{origRecord.proxied ? <Cloud color='primary' /> : <CloudOff />}</TableCell>
				<TableCell>{origRecord.ttl === 1 ? 'Auto' : prettyMilliseconds(origRecord.ttl * 1000)}</TableCell>
				<TableCell>
					<IconButton size='small' onClick={() => setOpen(!open)}>
						{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
					</IconButton>
				</TableCell>
			</TableRow>

			<TableRow>
				<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
					<Collapse in={open} timeout='auto' unmountOnExit>
						<Box sx={{ mt: 2, mb: 2 }}>
							<RecordForm domain={domain} record={record} onChange={(r) => setRecord(r)} />

							<Divider sx={{ mt: 2, mb: 2 }} />

							<Grid container spacing={2}>
								<Grid item xs>
									{record.id && (
										<Button variant='contained' color='error' onClick={() => setConfirmDeleteOpen(true)}>
											Delete
										</Button>
									)}
								</Grid>
								<Grid item>
									<Stack direction='row' spacing={2}>
										<Button variant='contained' color='inherit' onClick={() => setOpen(!open)}>
											Cancel
										</Button>
										<LoadingButton variant='contained' color='primary' onClick={() => handleUpdate()} loading={updateDomainRecord.isLoading} disabled={!validRecord(record)}>
											Save
										</LoadingButton>
									</Stack>
								</Grid>
							</Grid>
						</Box>
					</Collapse>
				</TableCell>
			</TableRow>

			<Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} fullWidth maxWidth='md'>
				<DialogTitle>Delete record for {domain.name}</DialogTitle>
				<DialogContent>
					<DialogContentText>Are you sure you want to delete this record?</DialogContentText>

					<TableContainer component={Paper}>
						<Table size='small'>
							<TableHead>
								<TableRow>
									<TableCell>Type</TableCell>
									<TableCell>Name</TableCell>
									<TableCell>Content</TableCell>
									<TableCell>Proxied</TableCell>
									<TableCell>TTL</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow key={origRecord.id} sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}>
									<TableCell component='th' scope='row'>
										{origRecord.type}
									</TableCell>
									<TableCell>{origRecord.name.replace(`.${domain.name}`, '')}</TableCell>
									<TableCell>
										{origRecord.content}
										{origRecord.priority ? (
											<Tooltip title={'Priority'} placement='top'>
												<Chip label={origRecord.priority} size='small' sx={{ ml: 1 }} />
											</Tooltip>
										) : (
											''
										)}
									</TableCell>
									<TableCell>{origRecord.proxied ? <Cloud color='primary' /> : <CloudOff />}</TableCell>
									<TableCell>{origRecord.ttl === 1 ? 'Auto' : prettyMilliseconds(origRecord.ttl * 1000)}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => setConfirmDeleteOpen(false)}>
						Cancel
					</Button>
					<LoadingButton onClick={() => handleDelete(record.id!)} endIcon={<Delete />} color='error' loading={deleteDomainRecord.isLoading} loadingPosition='end' variant='contained'>
						Delete
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</React.Fragment>
	);
}

export type DomainRecordsProps = {
	domain: Domain;
};
export default function DomainRecords({ domain }: DomainRecordsProps) {
	const { enqueueSnackbar } = useSnackbar();

	const { data: records, isLoading } = useGetDomainRecords(domain);

	const [newRecordOpen, setNewRecordOpen] = React.useState(false);

	const [record, setRecord] = React.useState<Record>({
		type: Type.A,
		name: '',
		content: '',
		proxied: false,
		ttl: 1,
		comment: '',
	});

	const handleClose = () => {
		setNewRecordOpen(false);

		setRecord({
			type: Type.A,
			name: '',
			content: '',
			proxied: false,
			ttl: 1,
			comment: '',
		});
	};

	React.useEffect(() => {
		handleClose();
	}, [domain]);

	const createDomainRecord = useCreateDomainRecord(domain);
	const handleCreate = async () => {
		await createDomainRecord
			.mutateAsync(record)

			.then(() => {
				handleClose();
			})
			.catch((err) => {
				console.log(err);
				enqueueSnackbar(
					`Failed to create dns record (${err.response.status}): ${(err.response.data.errors as any[])
						.map((e) => `${e.message}: ${(e?.error_chain as any[]).map((c) => c.message).join(', ')}`)
						.join(', ')}`,
					{ variant: 'error' }
				);
			});
	};

	return (
		<>
			{isLoading ? (
				<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<Container sx={{ mt: 6 }}>
					<Grid container alignItems='flex-end' sx={{ mb: 2 }}>
						<Grid item xs>
							<Typography variant='caption'>DNS</Typography>
							<Typography variant='h4'>{domain.name}</Typography>
						</Grid>
						<Grid item>
							<Button variant='contained' color='primary' startIcon={<Add />} onClick={() => setNewRecordOpen(!newRecordOpen)}>
								Add Record
							</Button>
						</Grid>
					</Grid>

					<Collapse in={newRecordOpen} timeout='auto' unmountOnExit>
						<Box sx={{ mt: 2, mb: 2 }}>
							<RecordForm domain={domain} record={record} onChange={(r) => setRecord(r)} />

							<Divider sx={{ mt: 2, mb: 2 }} />

							<Grid container spacing={2}>
								<Grid item xs></Grid>
								<Grid item>
									<Stack direction='row' spacing={2}>
										<Button variant='contained' color='inherit' onClick={() => setNewRecordOpen(!newRecordOpen)}>
											Cancel
										</Button>
										<LoadingButton variant='contained' color='primary' onClick={() => handleCreate()} loading={createDomainRecord.isLoading} disabled={!validRecord(record)}>
											Save
										</LoadingButton>
									</Stack>
								</Grid>
							</Grid>
						</Box>
					</Collapse>

					<TableContainer component={Paper}>
						<Table size='small'>
							<TableHead>
								<TableRow>
									<TableCell>Type</TableCell>
									<TableCell>Name</TableCell>
									<TableCell>Content</TableCell>
									<TableCell>Proxied</TableCell>
									<TableCell>TTL</TableCell>
									<TableCell></TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{records
									?.filter((r) => Object.values(Type).includes(r.type)) // only show supported record types
									.sort((a, b) => (a.name < b.name ? -1 : 1))
									.sort((a, b) => (a.type < b.type ? -1 : 1))
									.map((record) => (
										<RecordRow key={domain.zoneID + record.id} domain={domain} record={record} />
									))}
							</TableBody>
						</Table>
					</TableContainer>
				</Container>
			)}
		</>
	);
}
