require('dotenv').config();

import express from 'express';
import cors from 'cors';

import bodyParser from 'body-parser';

import path from 'path';
import sequelize from './database/db';
import Domains from './database/models/Domains';
import axios from 'axios';

import IpMonitor from 'ip-monitor';

import DDNSs from './database/models/DDNSs';
import { DDNS, DDNSSchedule, DDNSTrigger } from './web-app/src/types';
import Settings from './database/models/Settings';

import cron from 'node-cron';

const app = express();
const port = process.env.PORT || 8080;

let settings: Settings;
let ddnsCron: cron.ScheduledTask;

app.use(
	cors({
		origin: '*',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '/dist')));

let publicIpPollRate: number = 90 * 1000;
try {
	var pollRate = parseInt(process.env.PUBLIC_IP_POLL_RATE_SEC) * 1000;
	if (pollRate) publicIpPollRate = pollRate;
} catch (err) {}

const ipMonitor = new IpMonitor({ pollingInterval: publicIpPollRate }); // poll public IP every 90 sec
var publicIP;
ipMonitor.on('change', async (prevIp, newIp) => {
	publicIP = newIp;

	if (settings.ddnsTrigger === DDNSTrigger.PublicIP) {
		console.log(`IP changed from ${prevIp} to ${newIp}`);
		updateAllDDNS(newIp);
	}
});
ipMonitor.on('error', (error) => {
	console.error(error);
});

//Setting up server and SQL Connection
(async function () {
	await sequelize
		.sync({ alter: true })
		.then(() => {
			console.log('Database schema verified.');
		})
		.catch(async (err) => {
			console.log('Unabled to verify database:', err);
			// reset DB if failure syncing
			await sequelize.sync({ force: true }).then(() => {
				console.log('Database schema verified.');
			});
		});

	settings = (await Settings.findOrCreate({ where: { id: 1 }, defaults: { id: 1, ddnsTrigger: DDNSTrigger.PublicIP, ddnsSchedule: DDNSSchedule.HOURLY } }))[0];
	startDDNS();
	ipMonitor.start();

	app.listen(port, async () => {
		return console.log(`Server is listening on port ${port}`);
	});
})();

const startDDNS = () => {
	ddnsCron?.stop();

	if (settings.ddnsTrigger === DDNSTrigger.Schedule) {
		ddnsCron = cron.schedule(settings.ddnsSchedule, () => {
			updateAllDDNS(publicIP);
		});
	}
};

const updateAllDDNS = async (newIP: string) => {
	console.log('Running DDNS:', newIP);
	const ddnss = await DDNSs.findAll();
	for (const ddns of ddnss) {
		updateDDNS(ddns, newIP);
	}
};

const updateDDNS = async (ddns: DDNS, newIP: string) => {
	const domain = await Domains.findOne({
		where: {
			zoneID: ddns.zoneID,
		},
	});
	if (!domain) {
		console.log('DDNS Domain not found!');
		return;
	}

	try {
		const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${ddns.zoneID}/dns_records/${ddns.recordID}`, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		if (recordRes.data.result.content !== newIP) {
			await axios.put(
				`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records/${ddns.recordID}`,
				{
					type: recordRes.data.result.type,
					name: recordRes.data.result.name,
					content: newIP,
				},
				{
					headers: {
						Authorization: `Bearer ${domain.apiToken}`,
					},
				}
			);
			console.log('Updated DDNS for:', recordRes.data.result.name);
		}
	} catch (error) {
		console.log('Unable to update DDNS A record:', error?.response?.data ?? error);
	}
};

// get settings
app.get('/api/settings', async (req, res) => {
	try {
		const data = await Settings.findOrCreate({ where: { id: 1 }, defaults: { id: 1, ddnsTrigger: 'PIP' } });

		res.send(data[0]);
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

// update settings
app.post('/api/settings', async (req, res) => {
	try {
		const settingsData = (await Settings.upsert({ id: 1, ...req.body }))[0];
		settings = settingsData;

		startDDNS();

		res.send(settings);
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

// get domains
app.get('/api/zones', async (req, res) => {
	try {
		const data = await Domains.findAll();

		res.send(data);
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

// upsert domain
app.post('/api/zones', async (req, res) => {
	try {
		const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${req.body.zoneID}`, {
			headers: {
				Authorization: `Bearer ${req.body.apiToken}`,
			},
		});

		const data = await Domains.upsert({ ...req.body, name: recordRes.data.result.name });
		res.send(data[0]);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// import domains
app.post('/api/zones/import', async (req, res) => {
	try {
		const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones`, {
			headers: {
				Authorization: `Bearer ${req.body.apiToken}`,
			},
		});

		var domains = [];
		for (const key in recordRes.data.result) {
			if (Object.prototype.hasOwnProperty.call(recordRes.data.result, key)) {
				const zone = recordRes.data.result[key];

				const data = await Domains.upsert({
					zoneID: zone.id,
					name: zone.name,
					apiToken: req.body.apiToken,
				});

				domains.push(data[0]);
			}
		}

		res.send(domains);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// delete domain
app.delete('/api/zones/:zoneID', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		await Domains.destroy({
			where: {
				zoneID: req.params.zoneID,
			},
		})
			.then(() => {
				res.send('ok');
			})
			.catch((error) => {
				res.status(500);
				res.send(String(error));
			});
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

// get records
app.get('/api/zones/:zoneID/dns_records', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records`, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		res.send(recordRes.data.result);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// create record
app.post('/api/zones/:zoneID/dns_records', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		const recordRes = await axios.post(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records`, req.body, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		res.send(recordRes.data.result);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// update record
app.put('/api/zones/:zoneID/dns_records/:recordID', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		const recordRes = await axios.put(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records/${req.params.recordID}`, req.body, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		res.send(recordRes.data.result);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// delete record
app.delete('/api/zones/:zoneID/dns_records/:recordID', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		const recordRes = await axios.delete(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records/${req.params.recordID}`, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		res.send(recordRes.data.result);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

app.get('/api/ddns', async (req, res) => {
	try {
		const ddnss = await DDNSs.findAll();

		const records = await Promise.all(
			ddnss.map(async (ddns) => {
				const domain = await Domains.findOne({ where: { zoneID: ddns.zoneID } });
				if (!domain) {
					res.status(404);
					res.send('Domain not found.');
					return;
				}

				const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${ddns.zoneID}/dns_records/${ddns.recordID}`, {
					headers: {
						Authorization: `Bearer ${domain.apiToken}`,
					},
				});

				const dnsResult = recordRes.data.result;
				return {
					id: ddns.id,
					domain: domain,
					recordID: dnsResult.id,
					name: dnsResult.name,
					content: dnsResult.content,
					modified_on: dnsResult.modified_on,
				};
			})
		);

		res.send(records);
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// upsert ddns
app.post('/api/ddns', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.body.domain.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		const recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records/${req.body.recordID}`, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		const ddnsRes = await axios.put(
			`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records/${req.body.recordID}`,
			{
				type: recordRes.data.result.type,
				name: recordRes.data.result.name,
				content: publicIP,
			},
			{
				headers: {
					Authorization: `Bearer ${domain.apiToken}`,
				},
			}
		);
		const dnsResult = ddnsRes.data.result;
		console.log('Updated DDNS for:', dnsResult.name);

		const data = await DDNSs.upsert({ zoneID: domain.zoneID, recordID: req.body.recordID });

		res.send({
			id: data[0].id,
			domain: domain,
			recordID: dnsResult.id,
			name: dnsResult.name,
			content: dnsResult.content,
			modified_on: dnsResult.modified_on,
		});
	} catch (error) {
		console.log(error?.response?.data ?? error);
		res.status(error.response.status);
		res.send(error?.response?.data ?? error);
	}
});

// delete ddns
app.delete('/api/ddns/:id', async (req, res) => {
	try {
		const domain = await DDNSs.findOne({ where: { id: req.params.id } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		await DDNSs.destroy({
			where: {
				id: req.params.id,
			},
		})
			.then(() => {
				res.send('ok');
			})
			.catch((error) => {
				res.status(500);
				res.send(String(error));
			});
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/dist/index.html'));
});
