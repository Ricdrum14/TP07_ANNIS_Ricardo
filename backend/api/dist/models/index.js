"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const config_1 = __importDefault(require("../config"));
const pollution_model_1 = __importDefault(require("./pollution.model"));
const utilisateur_model_1 = __importDefault(require("./utilisateur.model"));
const sequelize = new sequelize_1.Sequelize(`postgres://${config_1.default.BDD.user}:${config_1.default.BDD.password}@${config_1.default.BDD.host}/${config_1.default.BDD.bdname}`, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    define: {
        timestamps: false
    }
});
const db = {
    Sequelize: sequelize_1.Sequelize,
    sequelize,
    pollution: (0, pollution_model_1.default)(sequelize),
    utilisateur: (0, utilisateur_model_1.default)(sequelize)
};
exports.default = db;
