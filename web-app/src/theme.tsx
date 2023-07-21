import * as React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Routes from './routes';

export default function Theme() {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

	const theme = React.useMemo(
		() =>
			createTheme({
				palette: {
					mode: prefersDarkMode ? 'dark' : 'light',
					primary: {
						light: '#ff9521',
						main: '#f48120',
						dark: '#c16619',
						contrastText: '#fff',
					},
					secondary: {
						light: '#f6685e',
						main: '#f44336',
						dark: '#aa2e25',
						contrastText: '#fff',
					},
				},
			}),
		[prefersDarkMode]
	);

	return (
		<Router>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Routes />
			</ThemeProvider>
		</Router>
	);
}
