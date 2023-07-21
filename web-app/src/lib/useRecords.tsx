import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { Domain, Record } from '../types';

const QUERY_KEY = ['dns_records'];

export const useGetDomainRecords = (domain: Domain) => {
	const { enqueueSnackbar } = useSnackbar();

	return useQuery({
		queryKey: [...QUERY_KEY, domain.zoneID],
		queryFn: async (): Promise<Record[]> => {
			var res = await axios.get(`/api/zones/${domain.zoneID}/dns_records`);

			return res.data as Record[];
		},
		onError(err) {
			enqueueSnackbar('Failed to get domain records: ' + String(err), { variant: 'error' });
		},
	});
};
