export type Domain = {
	domain: string;
	zoneID: string;
	apiToken: string;

	// Metadata
	createdAt?: Date;
	updatedAt?: Date;
};

export interface Record {
	id?: string;
	zone_id?: string;
	zone_name?: string;
	name: string;
	type: Type;
	content: string;
	proxiable?: boolean;
	proxied: boolean;
	ttl: number;
	locked?: boolean;
	meta?: Meta;
	comment: string;
	tags?: any[];
	created_on?: Date;
	modified_on?: Date;
	priority?: number;
	data?: Data;
}

export interface Data {
	name: string;
	port: number;
	priority: number;
	proto: string;
	service: string;
	target: string;
	weight: number;
}

export interface Meta {
	auto_added: boolean;
	managed_by_apps: boolean;
	managed_by_argo_tunnel: boolean;
	source: Source;
}

export enum Source {
	Primary = 'primary',
}

export enum Type {
	A = 'A',
	Cname = 'CNAME',
	MX = 'MX',
	Srv = 'SRV',
	Txt = 'TXT',
}
