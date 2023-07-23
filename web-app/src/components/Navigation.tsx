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
} from '@mui/material';
import { Menu as MenuIcon, Lan, Settings } from '@mui/icons-material';

import { useGetDomains } from '../lib';
import AddDomain from './AddDomain';
import DomainMenu from './DomainMenu';

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
	const [drawerOpen, setDrawerOpen] = React.useState(true);

	const [open, setOpen] = React.useState(false);

	const { data: domains } = useGetDomains();

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
									<Settings />
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
					</Box>
				</Drawer>
				<Box component='main' sx={{ flexGrow: 1 }}>
					<Toolbar />
					<Box sx={{ mb: 4 }}>{children}</Box>
				</Box>
			</Box>

			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='xs'>
				<DialogTitle>Manage Domains</DialogTitle>
				<DialogContent>
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
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => setOpen(false)}>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default Navigation;
