import { Domain } from '../../web-app/src/types';
import { CreationOptional, DataTypes, InferCreationAttributes, Model } from 'sequelize';

import sequelize from '../db';

export default class Domains extends Model<Domain, InferCreationAttributes<Domains>> {
	declare zoneID: string;
	declare name: string;
	declare apiToken: string;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

Domains.init(
	{
		zoneID: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		apiToken: {
			type: DataTypes.STRING,
			allowNull: false,
		},

		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		tableName: 'domains',
		sequelize, // passing the `sequelize` instance is required
	}
);
