import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { styled, Theme } from '@mui/material/styles';
import {
	AppBar,
	Box,
	CSSObject,
	Divider,
	Drawer as MuiDrawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	Stack,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Grid,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	LinearProgress,
} from '@mui/material';
import { Menu as MenuIcon, Lan, Settings as SettingsIcon, DynamicForm, ExpandMore } from '@mui/icons-material';

import { useGetDomains, useGetSettings, useUpdateSettings } from '../lib';
import AddDomain from './AddDomain';
import DomainMenu from './DomainMenu';
import { DDNSSchedule, DDNSTrigger, Settings } from '../types';
import { useSnackbar } from 'notistack';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create('width', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: 'hidden',
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up('sm')]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop: string) => prop !== 'open' })(({ theme, open }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: 'nowrap',
	boxSizing: 'border-box',
	...(open && {
		...openedMixin(theme),
		'& .MuiDrawer-paper': openedMixin(theme),
	}),
	...(!open && {
		...closedMixin(theme),
		'& .MuiDrawer-paper': closedMixin(theme),
	}),
}));

const Navigation: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const [drawerOpen, setDrawerOpen] = React.useState(true);

	const [open, setOpen] = React.useState(false);
	const [expanded, setExpanded] = React.useState<string | false>('domains');

	const { data: settings, isLoading: settingsLoading } = useGetSettings();
	const { data: domains } = useGetDomains();

	const handleClose = () => {
		setOpen(false);
		setExpanded('domains');
	};

	const handleRxpandedChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : false);
	};

	const updateSettings = useUpdateSettings();
	const handleUpdateSettings = (settings: Omit<Settings, 'id'>) => {
		updateSettings
			.mutateAsync(settings)

			.catch((err) => {
				console.log(err);
				enqueueSnackbar(`Failed to update settings (${err.response.status}): ${(err.response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
			});
	};

	return (
		<>
			<Box sx={{ display: 'flex' }}>
				<AppBar position='fixed' color='primary' enableColorOnDark sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
					<Toolbar>
						<IconButton color='inherit' aria-label='open drawer' onClick={() => setDrawerOpen(!drawerOpen)} edge='start' sx={{ mr: 2 }}>
							<MenuIcon />
						</IconButton>

						<Typography
							variant='h6'
							noWrap
							component={Link}
							to='/'
							sx={{
								flexGrow: 1,
								color: 'inherit',
								textDecoration: 'none',
							}}
						>
							Cloudflare DNS
						</Typography>

						<Box sx={{ flexGrow: 0 }}>
							<Stack direction='row' spacing={2}>
								<IconButton color='inherit' size='large' onClick={() => setOpen(true)}>
									<SettingsIcon />
								</IconButton>
							</Stack>
						</Box>
					</Toolbar>
				</AppBar>
				<Drawer variant='permanent' open={drawerOpen}>
					<Toolbar />
					<Box>
						<List>
							{domains
								?.sort((a, b) => (a.name > b.name ? 1 : -1))
								.map((domain, i) => (
									<ListItem key={i} disablePadding>
										<ListItemButton component={Link} to={`/${domain.zoneID}`} selected={location.pathname.startsWith(`/${domain.zoneID}`)}>
											<ListItemIcon>
												<Lan />
											</ListItemIcon>
											<ListItemText primary={domain.name} />
										</ListItemButton>
									</ListItem>
								))}
						</List>
						<Divider />
						<AddDomain />

						{domains?.length !== 0 && (
							<>
								<Divider />
								<List>
									<ListItem disablePadding>
										<ListItemButton component={Link} to={`/ddns`} selected={location.pathname === '/ddns'}>
											<ListItemIcon>
												<DynamicForm />
											</ListItemIcon>
											<ListItemText primary='Dynamic DNS' />
										</ListItemButton>
									</ListItem>
								</List>
							</>
						)}
					</Box>
				</Drawer>
				<Box component='main' sx={{ flexGrow: 1 }}>
					<Toolbar />
					<Box sx={{ mb: 4 }}>{children}</Box>
				</Box>
			</Box>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
				<DialogTitle>Settings</DialogTitle>
				<DialogContent>
					<Accordion expanded={expanded === 'domains'} onChange={handleRxpandedChange('domains')}>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography>Domains</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<List>
								{domains
									?.sort((a, b) => (a.name > b.name ? 1 : -1))
									.map((domain, i) => (
										<ListItem key={i} secondaryAction={<DomainMenu domain={domain} />}>
											<ListItemIcon>
												<Lan />
											</ListItemIcon>
											<ListItemText primary={domain.name} />
										</ListItem>
									))}
							</List>
							<Divider />
							<AddDomain />
						</AccordionDetails>
					</Accordion>

					{domains?.length !== 0 && (
						<>
							<Accordion expanded={expanded === 'ddns'} onChange={handleRxpandedChange('ddns')}>
								<AccordionSummary expandIcon={<ExpandMore />}>
									<Typography>Dynamic DNS</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Grid container spacing={2}>
										<Grid item xs={12}>
											<FormControl fullWidth disabled={settingsLoading || updateSettings.isLoading}>
												<InputLabel>Trigger</InputLabel>
												<Select
													value={settings?.ddnsTrigger}
													label='Trigger'
													onChange={(e) => {
														handleUpdateSettings({ ...settings!, ddnsTrigger: e.target.value as DDNSTrigger });
													}}
												>
													<MenuItem value={DDNSTrigger.PublicIP}>Public IP Change</MenuItem>
													<MenuItem value={DDNSTrigger.Schedule}>Schedule</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										{settings?.ddnsTrigger === DDNSTrigger.Schedule && (
											<Grid item xs={12}>
												<FormControl fullWidth disabled={settingsLoading || updateSettings.isLoading}>
													<InputLabel>Schedule</InputLabel>
													<Select
														value={settings?.ddnsSchedule}
														label='Schedule'
														onChange={(e) => {
															handleUpdateSettings({ ...settings!, ddnsSchedule: e.target.value as DDNSSchedule });
														}}
													>
														<MenuItem value={DDNSSchedule.HOURLY}>Hourly</MenuItem>
														<MenuItem value={DDNSSchedule.DAILY}>Daily</MenuItem>
														<MenuItem value={DDNSSchedule.WEEKLY}>Weekly</MenuItem>
													</Select>
												</FormControl>
											</Grid>
										)}
										<Grid item xs={12}>
											<Box sx={{ width: '100%' }}>{settingsLoading || (updateSettings.isLoading && <LinearProgress />)}</Box>
										</Grid>
									</Grid>
								</AccordionDetails>
							</Accordion>
						</>
					)}
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={handleClose}>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default Navigation;
