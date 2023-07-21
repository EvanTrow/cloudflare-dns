import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'postgres',
	database: 'postgres',
	schema: 'public',
	logging: false,
});

export default sequelize;
