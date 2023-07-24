import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { Settings } from '../types';

const QUERY_KEY = ['settings'];

export const useGetSettings = () => {
	const { enqueueSnackbar } = useSnackbar();

	return useQuery({
		queryKey: QUERY_KEY,
		queryFn: async (): Promise<Settings> => {
			var res = await axios.get('/api/settings');

			return res.data as Settings;
		},
		onError(err) {
			console.log(err);
			enqueueSnackbar('Failed to get settings: ' + String(err), { variant: 'error' });
		},
	});
};

export const useUpdateSettings = () => {
	const queryClient = useQueryClient();

	return useMutation(
		async (settings: Omit<Settings, 'id'>): Promise<Settings> => {
			var res = await axios.post(`/api/settings`, settings);

			return res.data as Settings;
		},
		{
			onSuccess: (settings: Settings) => {
				queryClient.setQueryData(QUERY_KEY, settings);
			},
		}
	);
};
