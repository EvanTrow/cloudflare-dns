import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { DDNSResult } from '../types';

export const DDNS_QUERY_KEY = ['ddns'];

export const useGetDDNS = () => {
	const { enqueueSnackbar } = useSnackbar();

	return useQuery({
		queryKey: DDNS_QUERY_KEY,
		queryFn: async (): Promise<DDNSResult[]> => {
			var res = await axios.get('/api/ddns');

			return res.data as DDNSResult[];
		},
		onError(err) {
			console.log(err);
			enqueueSnackbar('Failed to get DDNS: ' + String(err), { variant: 'error' });
		},
	});
};

export const useCreateDDNS = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (ddns: Omit<DDNSResult, 'id' | 'content' | 'name' | 'modified_on'>): Promise<DDNSResult> => {
			var res = await axios.post(`/api/ddns`, ddns);

			return res.data as DDNSResult;
		},
		{
			onSuccess: (ddns: DDNSResult) => {
				queryClient.setQueryData(DDNS_QUERY_KEY, (prevDdns: DDNSResult[] | undefined) => {
					if (prevDdns) {
						if (prevDdns.find((d) => d.recordID === ddns.recordID && d.domain.zoneID === ddns.domain.zoneID)) {
							return [...prevDdns];
						} else {
							return [...prevDdns, ddns];
						}
					} else {
						return [ddns];
					}
				});
			},
		}
	);
};

export const useDeleteDDNS = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (id: number): Promise<number> => {
			await axios.delete(`/api/ddns/${id}`);

			return id;
		},
		{
			onSuccess: (id) => {
				queryClient.setQueryData(DDNS_QUERY_KEY, (prevDdns: DDNSResult[] | undefined) => (prevDdns ? prevDdns.filter((d) => d.id !== id) : prevDdns));
			},
		}
	);
};
