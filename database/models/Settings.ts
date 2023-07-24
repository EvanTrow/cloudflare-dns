import { Settings as SettingsType } from '../../web-app/src/types';
import { CreationOptional, DataTypes, InferCreationAttributes, Model } from 'sequelize';

import sequelize from '../db';

export default class Settings extends Model<SettingsType, InferCreationAttributes<Settings>> {
	declare id: number;
	declare ddnsTrigger: string;
	declare ddnsSchedule: string;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
}

Settings.init(
	{
		id: {
			type: DataTypes.NUMBER,
			primaryKey: true,
			allowNull: false,
		},
		ddnsTrigger: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		ddnsSchedule: {
			type: DataTypes.STRING,
			allowNull: false,
		},

		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		tableName: 'settings',
		sequelize, // passing the `sequelize` instance is required
	}
);
