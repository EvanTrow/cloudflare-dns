import * as React from 'react';
import { Link, useNavigate, useLocation, Location } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { styled, Theme } from '@mui/material/styles';
import { AppBar, Avatar, Box, CSSObject, Divider, Drawer as MuiDrawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { Menu as MenuIcon, Add, Public, Dns, Lan } from '@mui/icons-material';

import { useGetDomains } from '../lib';
import AddDomain from './AddDomain';

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
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const { data: domains, isLoading } = useGetDomains();

	return (
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
				</Toolbar>
			</AppBar>
			<Drawer variant='permanent' open={drawerOpen}>
				<Toolbar />
				<Box>
					<List>
						{domains
							?.sort((a, b) => (a.domain > b.domain ? 1 : -1))
							.map((domain, i) => (
								<ListItem key={i} disablePadding>
									<ListItemButton component={Link} to={`/${domain.zoneID}`} selected={location.pathname.startsWith(`/${domain.zoneID}`)}>
										<ListItemIcon>
											<Lan />
										</ListItemIcon>
										<ListItemText primary={domain.domain} />
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
	);
};

export default Navigation;

function getLocation(path: string) {
	if (path.startsWith('/list')) {
		return 1;
	} else if (path.startsWith('/group')) {
		return 2;
	} else if (path.startsWith('/shopping')) {
		return 3;
	}
	return 0;
}
