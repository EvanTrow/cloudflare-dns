import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import { DDNSResult, Domain, Record, Type } from '../types';
import { DDNS_QUERY_KEY } from './useDDNS';

const QUERY_KEY = ['dns_records'];

export const useGetDomainRecords = (domain: Domain) => {
	const { enqueueSnackbar } = useSnackbar();
	return useQuery({
		queryKey: [...QUERY_KEY, domain?.zoneID],
		queryFn: async (): Promise<Record[]> => {
			if (domain) {
				var res = await axios.get(`/api/zones/${domain.zoneID}/dns_records`);

				return res.data as Record[];
			} else {
				return [];
			}
		},
		onError(err) {
			console.log(err);
			enqueueSnackbar(`Failed to get domain records (${(err as any).response.status}): ${((err as any).response.data.errors as any[]).map((e) => e.message).join(', ')}`, {
				variant: 'error',
			});
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
				// remove ddns records
				queryClient.setQueryData(DDNS_QUERY_KEY, (prevDdns: DDNSResult[] | undefined) =>
					prevDdns ? prevDdns.filter((ddns) => ddns.recordID !== recordID && ddns.domain.zoneID !== domain.zoneID) : prevDdns
				);
				queryClient.setQueryData([...QUERY_KEY, domain.zoneID], (prevRecords: Record[] | undefined) => (prevRecords ? prevRecords.filter((record) => record.id !== recordID) : prevRecords));
			},
		}
	);
};

export const validRecord = (record: Record) => {
	const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	const ipv6Regex =
		/^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

	try {
		switch (record.type) {
			case Type.A:
				if (record.name.length > 0 && ipv4Regex.test(record.content)) {
					return true;
				} else return false;
			case Type.AAAA:
				if (record.name.length > 0 && ipv6Regex.test(record.content)) {
					return true;
				} else return false;
			case Type.CNAME:
				if (record.name.length > 0 && record.content.length > 0) {
					return true;
				} else return false;
			case Type.MX:
				if (record.name.length > 0 && record.content.length > 0 && record.priority! >= 0 && record.priority! <= 65535) {
					return true;
				} else return false;
			case Type.SRV:
				if (
					record.name!.length > 0 &&
					record.data!.service!.length > 0 &&
					record.data!.proto!.length > 0 &&
					record.priority! >= 0 &&
					record.priority! <= 65535 &&
					record.data!.weight! >= 0 &&
					record.data!.weight! <= 65535 &&
					record.data!.port! >= 0 &&
					record.data!.port! <= 65535 &&
					record.data!.target!.length > 0
				) {
					return true;
				} else return false;
			case Type.TXT:
				if (record.name.length > 0 && record.content.length > 0) {
					return true;
				} else return false;
			default:
				return false;
		}
	} catch (error) {
		return false;
	}
};
