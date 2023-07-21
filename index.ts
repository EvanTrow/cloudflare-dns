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

app.post('/api/zones', async (req, res) => {
	try {
		const data = await Domains.upsert(req.body);

		res.send(data[0]);
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});

app.get('/api/zones/:zoneID/dns_records', async (req, res) => {
	try {
		const domain = await Domains.findOne({ where: { zoneID: req.params.zoneID } });
		if (!domain) {
			res.status(404);
			res.send('Domain not found.');
			return;
		}

		var recordRes = await axios.get(`https://api.cloudflare.com/client/v4/zones/${domain.zoneID}/dns_records`, {
			headers: {
				Authorization: `Bearer ${domain.apiToken}`,
			},
		});

		res.send(recordRes.data.result);
	} catch (error) {
		console.log(error);
		res.status(500);
		res.send(String(error));
	}
});
