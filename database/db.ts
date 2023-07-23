import { Sequelize } from 'sequelize';
import fs from 'fs';

let isDockerCached;

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: isDocker() ? '/db/database.sqlite' : './database.sqlite',
	logging: false,
});

export default sequelize;

function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch {
		return false;
	}
}
function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch {
		return false;
	}
}
function isDocker() {
	// TODO: Use `??=` when targeting Node.js 16.
	if (isDockerCached === undefined) {
		isDockerCached = hasDockerEnv() || hasDockerCGroup();
	}

	return isDockerCached;
}
