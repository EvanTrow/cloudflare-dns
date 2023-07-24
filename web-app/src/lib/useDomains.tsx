import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { DDNSResult, Domain } from '../types';
import { DDNS_QUERY_KEY } from './useDDNS';

const QUERY_KEY = ['zones'];

export const useGetDomains = () => {
	const { enqueueSnackbar } = useSnackbar();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<Domain[]> => {
			var res = await axios.get('/api/zones');

			return res.data as Domain[];
		},
		onError(err) {
			console.log(err);
			enqueueSnackbar('Failed to get domains: ' + String(err), { variant: 'error' });
		},
	});
};

export const useUpsertDomain = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (domain: Omit<Domain, 'name'>): Promise<Domain> => {
			var res = await axios.post('/api/zones', domain);

			return res.data as Domain;
		},
		{
			onSuccess: (domain_updated: Domain) => {
				queryClient.setQueryData(QUERY_KEY, (prevDomains: Domain[] | undefined) => {
					if (prevDomains) {
						if (prevDomains.find((d) => d.zoneID === domain_updated.zoneID)) {
							return prevDomains.map((d) => {
								if (d.zoneID === domain_updated.zoneID) {
									return domain_updated;
								}
								return d;
							});
						} else {
							return [...prevDomains, domain_updated];
						}
					} else {
						return [domain_updated];
					}
				});
			},
		}
	);
};

export const useImportDomains = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (apiToken: string): Promise<Domain[]> => {
			const res = await axios.post(`/api/zones/import`, { apiToken: apiToken });

			return res.data as Domain[];
		},
		{
			onSuccess: (imported_domains) => {
				queryClient.setQueryData(QUERY_KEY, (prevDomains: Domain[] | undefined) => {
					if (prevDomains) {
						const mergedDomains = [...prevDomains];

						imported_domains.forEach((importedDomain) => {
							const existingIndex = mergedDomains.findIndex((d) => d.zoneID === importedDomain.zoneID);
							if (existingIndex !== -1) {
								mergedDomains[existingIndex] = importedDomain;
							} else {
								mergedDomains.push(importedDomain);
							}
						});

						return mergedDomains;
					} else {
						return [...imported_domains];
					}
				});
			},
		}
	);
};

export const useDeleteDomain = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (zoneID: string): Promise<string> => {
			await axios.delete(`/api/zones/${zoneID}`);

			return zoneID;
		},
		{
			onSuccess: (zoneID) => {
				// remove ddns records
				queryClient.setQueryData(DDNS_QUERY_KEY, (prevDdns: DDNSResult[] | undefined) => (prevDdns ? prevDdns.filter((ddns) => ddns.domain.zoneID !== zoneID) : prevDdns));
				queryClient.setQueryData(QUERY_KEY, (prevDomains: Domain[] | undefined) => (prevDomains ? prevDomains.filter((domain) => domain.zoneID !== zoneID) : prevDomains));
			},
		}
	);
};
