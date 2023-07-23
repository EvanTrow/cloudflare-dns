require('dotenv').config();

import express from 'express';
import cors from 'cors';

import bodyParser from 'body-parser';

import path from 'path';
import sequelize from './database/db';
import Domains from './database/models/Domains';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

app.use(
	cors({
		origin: '*',
		optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
	})
);

app.use(bodyParser.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname, '/dist')));

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

	app.listen(port, () => {
		return console.log(`Server is listening on port ${port}`);
	});
})();

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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
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
		console.log(error.response.data);
		res.status(error.response.status);
		res.send(error.response.data);
	}
});

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/dist/index.html'));
});
