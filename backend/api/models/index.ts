import { Sequelize } from 'sequelize';
import config from '../config';
import initPollutionModel from './pollution.model';
import initUtilisateurModel from './utilisateur.model';

const sequelize = new Sequelize(
  `postgres://${config.BDD.user}:${config.BDD.password}@${config.BDD.host}/${config.BDD.bdname}`,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: false //par défaut OFF pour tous les modèles
    }
  }
);

interface Database {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  pollution: ReturnType<typeof initPollutionModel>;
  utilisateur: ReturnType<typeof initUtilisateurModel>;
}

const db: Database = {
  Sequelize,
  sequelize,
  pollution: initPollutionModel(sequelize),
  utilisateur: initUtilisateurModel(sequelize)
};

// Associations
// 1 utilisateur -> plusieurs pollutions
db.utilisateur.hasMany(db.pollution, {
  foreignKey: 'utilisateur_id',
  as: 'pollutions',
  onDelete: 'CASCADE',
  hooks: true
});

// 1 pollution -> 1 utilisateur
db.pollution.belongsTo(db.utilisateur, {
  foreignKey: 'utilisateur_id',
  as: 'utilisateur'
});

export default db;
