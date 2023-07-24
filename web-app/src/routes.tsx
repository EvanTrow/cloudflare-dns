import { Route, Routes } from 'react-router-dom';

import { Backdrop, CircularProgress, Typography } from '@mui/material';

import { useGetDomains } from './lib/useDomains';

import Navigation from './components/Navigation';
import DomainRecords from './pages/DomainRecords';
import DDNSManagement from './pages/DDNSManagement';

function AppRoutes() {
	const { data: domains, isLoading } = useGetDomains();

	return (
		<>
			{isLoading ? (
				<Backdrop sx={{ color: '#fff', zIndex: 1000 }} open={true}>
					<CircularProgress color='inherit' />
				</Backdrop>
			) : (
				<Navigation>
					<Routes>
						<Route
							path='/'
							element={
								<Typography variant='h4' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
									Select a domain
								</Typography>
							}
						/>

						{domains?.map((domain, i) => (
							<Route key={domain.zoneID} path={`/${domain.zoneID}`} element={<DomainRecords domain={domain} />} />
						))}

						<Route path='/ddns' element={<DDNSManagement />} />

						<Route
							path='*'
							element={
								<Typography variant='h4' gutterBottom style={{ marginTop: 100, textAlign: 'center' }}>
									Page not found!
								</Typography>
							}
						/>
					</Routes>
				</Navigation>
			)}
		</>
	);
}

export default AppRoutes;
