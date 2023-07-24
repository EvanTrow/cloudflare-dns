import * as React from 'react';
import moment from 'moment';

import { Backdrop, Box, Chip, CircularProgress, Container, Divider, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { DynamicForm } from '@mui/icons-material';

import { useGetDDNS } from '../lib';

import AddDDNS from '../components/AddDDNS';
import DDNSMenu from '../components/DDNSMenu';

export default function DDNSManagement() {
	const { data: ddnss, isLoading: loadingDDNS } = useGetDDNS();

	return (
		<>
			{loadingDDNS ? (
				<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<Container maxWidth='sm' sx={{ mt: 4, mb: 4 }}>
					<List>
						{ddnss?.map((ddns, i) => (
							<React.Fragment key={i}>
								<ListItem secondaryAction={<DDNSMenu ddns={ddns} />}>
									<ListItemIcon>
										<DynamicForm />
									</ListItemIcon>
									<ListItemText
										primary={
											<>
												{ddns.name}
												<Chip label={ddns.content} size='small' sx={{ ml: 1 }} />
											</>
										}
										secondary={<Box sx={{ mt: 0.5 }}>Last Updated: {moment(ddns.modified_on).format('L LT')}</Box>}
									/>
								</ListItem>
								{i + 1 === ddnss?.length ? '' : <Divider />}
							</React.Fragment>
						))}
					</List>

					<AddDDNS />

					{ddnss?.length === 0 && (
						<Typography variant='h5' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
							Add a DNS A record to update the IP when your public IP changes.
						</Typography>
					)}
				</Container>
			)}
		</>
	);
}
