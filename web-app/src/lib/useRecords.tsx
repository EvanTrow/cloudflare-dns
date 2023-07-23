import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { Domain, Record, Type } from '../types';

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
			console.log(err);
			enqueueSnackbar(`Failed to get domain records (${(err as any).response.status}): ${((err as any).response.data.errors as any[]).map((e) => e.message).join(', ')}`, { variant: 'error' });
		},
	});
};

export const useCreateDomainRecord = (domain: Domain) => {
	const queryClient = useQueryClient();

	return useMutation(
		async (record: Record): Promise<Record> => {
			switch (record.type) {
				case Type.MX:
					delete record.proxied;
					break;
				case Type.SRV:
					delete record.proxied;
					break;
				case Type.TXT:
					delete record.proxied;
					break;
			}

			var res = await axios.post(`/api/zones/${domain.zoneID}/dns_records`, record);

			return res.data as Record;
		},
		{
			onSuccess: (record: Record) => {
				queryClient.setQueryData([...QUERY_KEY, domain.zoneID], (prevRecords: Record[] | undefined) => (prevRecords ? [...prevRecords, record] : [record]));
			},
		}
	);
};

export const useUpdateDomainRecord = (domain: Domain) => {
	const queryClient = useQueryClient();

	return useMutation(
		async (record: Record): Promise<Record> => {
			var res = await axios.put(`/api/zones/${domain.zoneID}/dns_records/${record.id}`, record);

			return res.data as Record;
		},
		{
			onSuccess: (record_updated: Record) => {
				queryClient.setQueryData([...QUERY_KEY, domain.zoneID], (prevRecords: Record[] | undefined) => {
					if (prevRecords) {
						const updatedLists = prevRecords.map((record) => {
							return record.id === record_updated.id ? record_updated : record;
						});
						return updatedLists;
					}
					return prevRecords;
				});
			},
		}
	);
};

export const useDeleteDomainRecord = (domain: Domain) => {
	const queryClient = useQueryClient();

	return useMutation(
		async (recordID: string): Promise<string> => {
			await axios.delete(`/api/zones/${domain.zoneID}/dns_records/${recordID}`);

			return recordID;
		},
		{
			onSuccess: (recordID) => {
				queryClient.setQueryData([...QUERY_KEY, domain.zoneID], (prevRecords: Record[] | undefined) => (prevRecords ? prevRecords.filter((record) => record.id !== recordID) : prevRecords));
			},
		}
	);
};
