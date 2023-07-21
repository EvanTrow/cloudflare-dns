import * as React from 'react';
import { useSnackbar } from 'notistack';
import prettyMilliseconds from 'pretty-ms';

import {
	Backdrop,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Collapse,
	Container,
	Divider,
	FormControl,
	FormControlLabel,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { Cloud, CloudOff, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

import { useGetDomainRecords } from '../lib';
import { Domain, Record } from '../types';

export type RecordRowProps = {
	domain: Domain;
	record: Record;
};
function RecordRow({ domain, record }: RecordRowProps) {
	const [open, setOpen] = React.useState(false);

	const [type, setType] = React.useState<string>(record.type);
	const [name, setName] = React.useState<string>(record.name.replace(`.${domain.domain}`, ''));
	const [content, setContent] = React.useState<string>(record.content);
	const [proxied, setProxied] = React.useState<boolean>(record.proxied);
	const [ttl, setTtl] = React.useState<number>(record.ttl);
	const [comment, setComment] = React.useState<string>(record.comment);

	React.useEffect(() => {
		setType(record.type);
		setName(record.name.replace(`.${domain.domain}`, ''));
		setContent(record.content);
		setProxied(record.proxied);
		setTtl(record.ttl);
		setComment(record.comment);
	}, [open]);

	return (
		<React.Fragment>
			<TableRow key={record.id} sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} hover onClick={() => setOpen(!open)}>
				<TableCell component='th' scope='row'>
					{record.type}
				</TableCell>
				<TableCell>{record.name.replace(`.${domain.domain}`, '')}</TableCell>
				<TableCell>
					{record.content}
					{record.priority ? (
						<Tooltip title={'Priority'} placement='top'>
							<Chip label={record.priority} size='small' sx={{ ml: 1 }} />
						</Tooltip>
					) : (
						''
					)}
				</TableCell>
				<TableCell>{record.proxied ? <Cloud color='primary' /> : <CloudOff />}</TableCell>
				<TableCell>{record.ttl === 1 ? 'Auto' : prettyMilliseconds(record.ttl * 1000)}</TableCell>
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
							<Grid container spacing={2}>
								<Grid item>
									<FormControl sx={{ width: 120 }}>
										<InputLabel>Type</InputLabel>
										<Select label='Type' value={type} onChange={(e) => setType(e.target.value)}>
											<MenuItem value={'A'}>A</MenuItem>
											<MenuItem value={'CNAME'}>CNAME</MenuItem>
											<MenuItem value={'MX'}>MX</MenuItem>
											<MenuItem value={'TXT'}>TXT</MenuItem>
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs>
									<TextField fullWidth required label='Name' variant='outlined' value={name} onChange={(e) => setName(e.target.value)} />
								</Grid>
								<Grid item xs>
									<TextField fullWidth required label='Content' variant='outlined' value={content} onChange={(e) => setContent(e.target.value)} />
								</Grid>
								<Grid item>
									<FormControlLabel
										control={
											<Checkbox
												checked={proxied}
												onChange={(e) => {
													setProxied(e.target.checked);
													if (e.target.checked) setTtl(1);
												}}
												icon={<CloudOff />}
												checkedIcon={<Cloud color='primary' />}
											/>
										}
										label='Proxy'
										sx={{ ml: 0.1, mt: 0.8 }}
									/>
								</Grid>
								<Grid item>
									<FormControl sx={{ width: 120 }}>
										<InputLabel>TTL</InputLabel>
										<Select label='TTL' value={ttl} onChange={(e) => setTtl(e.target.value as number)} disabled={proxied}>
											<MenuItem value={1}>Auto</MenuItem>
											<MenuItem value={60}>1m</MenuItem>
											<MenuItem value={120}>2m</MenuItem>
											<MenuItem value={300}>5m</MenuItem>
											<MenuItem value={600}>10m</MenuItem>
											<MenuItem value={900}>15m</MenuItem>
											<MenuItem value={1800}>30m</MenuItem>
											<MenuItem value={3600}>1h</MenuItem>
											<MenuItem value={7200}>2h</MenuItem>
											<MenuItem value={18000}>5h</MenuItem>
											<MenuItem value={43200}>12h</MenuItem>
											<MenuItem value={86400}>1d</MenuItem>
										</Select>
									</FormControl>
								</Grid>
							</Grid>

							<Divider sx={{ mt: 2, mb: 2 }} />

							<Grid container spacing={2}>
								<Grid item xs>
									<TextField fullWidth label='Comment' variant='outlined' value={comment} onChange={(e) => setComment(e.target.value)} />
								</Grid>
							</Grid>

							<Divider sx={{ mt: 2, mb: 2 }} />

							<Grid container spacing={2}>
								<Grid item xs>
									<Button variant='contained' color='error'>
										Delete
									</Button>
								</Grid>
								<Grid item>
									<Stack direction='row' spacing={2}>
										<Button variant='contained' color='inherit' onClick={() => setOpen(!open)}>
											Cancel
										</Button>
										<Button variant='contained' color='primary'>
											Save
										</Button>
									</Stack>
								</Grid>
							</Grid>
						</Box>
					</Collapse>
				</TableCell>
			</TableRow>
		</React.Fragment>
	);
}

export type DomainRecordsProps = {
	domain: Domain;
};
export default function DomainRecords({ domain }: DomainRecordsProps) {
	const { enqueueSnackbar } = useSnackbar();

	const { data: records, isLoading } = useGetDomainRecords(domain);

	return (
		<>
			{isLoading ? (
				<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<Container sx={{ mt: 6 }}>
					<Typography variant='caption'>DNS</Typography>
					<Typography variant='h4' gutterBottom>
						{domain.domain}
					</Typography>

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
								{records?.map((record) => (
									<RecordRow domain={domain} record={record} />
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Container>
			)}
		</>
	);
}
