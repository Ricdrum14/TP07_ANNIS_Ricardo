"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
function default_1(sequelize) {
    const Pollution = sequelize.define("pollution", {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        titre: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        lieu: {
            type: sequelize_1.DataTypes.STRING
        },
        date_observation: {
            type: sequelize_1.DataTypes.DATE
        },
        type_pollution: {
            type: sequelize_1.DataTypes.STRING
        },
        description: {
            type: sequelize_1.DataTypes.TEXT
        },
        latitude: {
            // stocke les coordonnées GPS avec 6 décimales
            type: sequelize_1.DataTypes.DECIMAL(9, 6)
        },
        longitude: {
            type: sequelize_1.DataTypes.DECIMAL(9, 6)
        },
        photo_url: {
            type: sequelize_1.DataTypes.STRING
        }
    });
    return Pollution;
}
;
