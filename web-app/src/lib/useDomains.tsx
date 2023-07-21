import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { Domain } from '../types';

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
			enqueueSnackbar('Failed to get domains: ' + String(err), { variant: 'error' });
		},
	});
};

export const useCreateDomain = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (domain: Domain): Promise<Domain> => {
			var res = await axios.post('/api/zones', domain);

			return res.data as Domain;
		},
		{
			onSuccess: (domain: Domain) => {
				queryClient.setQueryData(QUERY_KEY, (prevDomains: Domain[] | undefined) => (prevDomains ? [...prevDomains, domain] : [domain]));
			},
		}
	);
};
