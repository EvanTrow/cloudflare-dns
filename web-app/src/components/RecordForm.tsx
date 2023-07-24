import * as React from 'react';

import { Checkbox, Divider, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Cloud, CloudOff } from '@mui/icons-material';

import { Domain, Proto, Record, Type } from '../types';

type RecordFormProps = {
	domain: Domain;
	record: Record;
	onChange(record: Record): void;
};
export default function RecordForm({ domain, record, onChange }: RecordFormProps) {
	const [type, setType] = React.useState<Type>(record.type);
	const [name, setName] = React.useState<string>(record.name.replace(`.${domain.name}`, ''));
	const [content, setContent] = React.useState<string>(record.content);
	const [priority, setPriority] = React.useState<number>(record.priority!);
	const [proxied, setProxied] = React.useState<boolean>(record.proxied!);

	// SRV
	const [service, setService] = React.useState<string>(record.data?.service!);
	const [proto, setProto] = React.useState<Proto>(record.data?.proto!);
	const [weight, setWeight] = React.useState<number | undefined>(record.data?.weight!);
	const [port, setPort] = React.useState<number | undefined>(record.data?.port!);
	const [target, setTarget] = React.useState<string>(record.data?.target!);

	const [ttl, setTtl] = React.useState<number>(record.ttl);
	const [comment, setComment] = React.useState<string>(record.comment);

	React.useEffect(() => {
		setType(record.type);
		setName(record.name.replace(`.${domain.name}`, '').replace(`${record.data?.service}.${record.data?.proto}.`, ''));
		setContent(record.content);
		setPriority(record.priority!);
		setProxied(record.proxied!);

		// SRV
		setService(record.data?.service!);
		setProto(record.data?.proto!);
		setWeight(record.data?.weight!);
		setPort(record.data?.port!);
		setTarget(record.data?.target!);

		setTtl(record.ttl);
		setComment(record.comment);
	}, [domain, record]);

	React.useEffect(() => {
		onChange({
			...record,
			type: type,
			name: name,
			content: content,
			priority: priority,
			proxied: proxied,

			data: {
				name: name,
				service: service,
				proto: proto,
				priority: priority,
				weight: weight,
				port: port,
				target: target,
			},

			ttl: ttl,
			comment: comment,
		});
		// eslint-disable-next-line
	}, [type, name, content, priority, proxied, service, proto, weight, port, target, ttl, comment]);

	return (
		<>
			<Grid container>
				<Grid item xs={12}>
					<Grid container spacing={2}>
						<Grid item>
							<FormControl sx={{ width: 120 }}>
								<InputLabel>Type</InputLabel>
								<Select label='Type' value={type} onChange={(e) => setType(e.target.value as Type)}>
									<MenuItem value={Type.A}>A</MenuItem>
									<MenuItem value={Type.AAAA}>AAAA</MenuItem>
									<MenuItem value={Type.CNAME}>CNAME</MenuItem>
									<MenuItem value={Type.MX}>MX</MenuItem>
									<MenuItem value={Type.SRV}>SRV</MenuItem>
									<MenuItem value={Type.TXT}>TXT</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs>
							<TextField fullWidth required label='Name' variant='outlined' value={name} onChange={(e) => setName(e.target.value)} />
						</Grid>
						{type !== Type.SRV && (
							<Grid item xs>
								<TextField
									fullWidth
									required
									label={
										{
											[Type.A]: 'IPv4 Address',
											[Type.AAAA]: 'IPv6 Address',
											[Type.CNAME]: 'Target',
											[Type.MX]: 'Mail Server',
											[Type.TXT]: 'Content',
										}[type as string]
									}
									variant='outlined'
									value={content}
									onChange={(e) => setContent(e.target.value)}
								/>
							</Grid>
						)}
						{![Type.MX, Type.TXT, Type.SRV].includes(type) && (
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
						)}
						{type === Type.SRV && (
							<Grid item>
								<TextField
									sx={{ width: 150 }}
									required
									label={'Service'}
									variant='outlined'
									value={service}
									onChange={(e) => {
										setService(e.target.value);
									}}
								/>
							</Grid>
						)}
						{type === Type.SRV && (
							<Grid item>
								<FormControl sx={{ width: 120 }} required>
									<InputLabel>Protocol</InputLabel>
									<Select label='Protocol' value={proto} onChange={(e) => setProto(e.target.value as Proto)}>
										<MenuItem value={Proto.TCP}>TCP</MenuItem>
										<MenuItem value={Proto.UDP}>UDP</MenuItem>
										<MenuItem value={Proto.TLS}>TLS</MenuItem>
									</Select>
								</FormControl>
							</Grid>
						)}
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
						{[Type.MX, Type.SRV].includes(type) && (
							<Grid item>
								<TextField
									sx={{ width: 120 }}
									required
									label={'Priority'}
									variant='outlined'
									value={priority}
									onChange={(e) => {
										setPriority(Math.max(Number(0), Math.min(Number(65535), Number(e.target.value))));
									}}
									type='number'
									inputProps={{ inputMode: 'numeric', min: '0', max: '65535' }}
								/>
							</Grid>
						)}
					</Grid>
				</Grid>

				{type === Type.SRV && (
					<Grid item xs={12} sx={{ mt: 2 }}>
						<Grid container spacing={2}>
							<Grid item>
								<TextField
									sx={{ width: 120 }}
									required
									label={'Weight'}
									variant='outlined'
									value={weight}
									onChange={(e) => {
										setWeight(Math.max(Number(0), Math.min(Number(65535), Number(e.target.value))));
									}}
									type='number'
									inputProps={{ inputMode: 'numeric', min: '0', max: '65535' }}
								/>
							</Grid>
							<Grid item>
								<TextField
									sx={{ width: 120 }}
									required
									label={'Port'}
									variant='outlined'
									value={port}
									onChange={(e) => {
										setPort(Math.max(Number(0), Math.min(Number(65535), Number(e.target.value))));
									}}
									type='number'
									inputProps={{ inputMode: 'numeric', min: '0', max: '65535' }}
								/>
							</Grid>
							<Grid item xs>
								<TextField
									required
									fullWidth
									label={'Target'}
									variant='outlined'
									value={target}
									onChange={(e) => {
										setTarget(e.target.value);
									}}
								/>
							</Grid>
						</Grid>
					</Grid>
				)}

				<Grid item xs={12}>
					<Divider sx={{ mt: 2, mb: 2 }} />
				</Grid>

				<Grid item xs={12}>
					<Grid container spacing={2}>
						<Grid item xs>
							<TextField fullWidth label='Comment' variant='outlined' value={comment} onChange={(e) => setComment(e.target.value)} />
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}
