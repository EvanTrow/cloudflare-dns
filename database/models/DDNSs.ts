import { DDNS } from '../../web-app/src/types';
import { CreationOptional, DataTypes, InferCreationAttributes, Model } from 'sequelize';

import sequelize from '../db';

export default class DDNSs extends Model<DDNS, InferCreationAttributes<DDNSs>> {
	declare id: number;
	declare zoneID: string;
	declare recordID: string;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

DDNSs.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},

		zoneID: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		recordID: {
			type: DataTypes.STRING,
			allowNull: false,
		},

		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		tableName: 'ddns',
		sequelize, // passing the `sequelize` instance is required
	}
);
