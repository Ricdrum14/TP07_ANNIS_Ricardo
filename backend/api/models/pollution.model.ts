import { Sequelize, DataTypes, Model, ModelStatic, Optional } from 'sequelize';

export interface PollutionAttributes {
  id?: number;
  titre: string;
  lieu?: string;
  date_observation?: Date;
  type_pollution?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;

  // si tu veux les typer (facultatif)
  created_at?: Date;
  updated_at?: Date;

  //futur champ FK
  utilisateur_id: number;
}

type PollutionCreationAttributes = Optional<PollutionAttributes, 'id' | 'created_at' | 'updated_at'>;

interface PollutionModel extends Model<PollutionAttributes, PollutionCreationAttributes>, PollutionAttributes {}

export default function (sequelize: Sequelize): ModelStatic<PollutionModel> {
  const Pollution = sequelize.define<PollutionModel>(
    'pollution',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      titre: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lieu: {
        type: DataTypes.STRING
      },
      date_observation: {
        type: DataTypes.DATE
      },
      type_pollution: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      latitude: {
        type: DataTypes.DECIMAL(9, 6)
      },
      longitude: {
        type: DataTypes.DECIMAL(9, 6)
      },
      photo_url: {
        type: DataTypes.STRING
      },
      // (Optionnel) tu peux déclarer les champs si tu veux qu’ils apparaissent clairement
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      //FK vers utilisateur
      utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: 'pollution',
      //Sequelize gère automatiquement createdAt/updatedAt
      timestamps: true,
      //mapping vers tes colonnes réelles
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return Pollution;
}
