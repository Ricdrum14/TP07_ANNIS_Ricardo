"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const sequelize_1 = require("sequelize");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Fonction d'initialisation du modèle
function default_1(sequelize) {
    const Utilisateur = sequelize.define('utilisateur', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false
        },
        prenom: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false
        },
        email: {
            type: sequelize_1.DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        mot_de_passe: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'utilisateur',
            validate: {
                isIn: [['admin', 'utilisateur']]
            }
        },
        date_creation: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    }, {
        tableName: 'utilisateur',
        timestamps: false
    });
    //Hooks de hashage du mot de passe
    Utilisateur.beforeCreate(async (user) => {
        // Empêche de re-hasher un mot de passe déjà hashé
        if (!user.mot_de_passe.startsWith('$2b$')) {
            user.mot_de_passe = await bcrypt_1.default.hash(user.mot_de_passe, 10);
        }
    });
    Utilisateur.beforeUpdate(async (user) => {
        if (user.changed('mot_de_passe')) {
            user.mot_de_passe = await bcrypt_1.default.hash(user.mot_de_passe, 10);
        }
    });
    //Méthode personnalisée pour comparer le mot de passe
    Utilisateur.prototype.comparePassword = async function (password) {
        return bcrypt_1.default.compare(password, this.mot_de_passe);
    };
    return Utilisateur;
}
