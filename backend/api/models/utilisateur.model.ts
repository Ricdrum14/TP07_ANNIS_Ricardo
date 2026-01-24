import { Sequelize, DataTypes, Model, ModelStatic, Optional } from 'sequelize';
import bcrypt from 'bcrypt';

// Définition des attributs de base
export interface UtilisateurAttributes {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  role?: 'admin' | 'utilisateur';
  date_creation?: Date;
}

// Pour les créations (id facultatif)
type UtilisateurCreationAttributes = Optional<UtilisateurAttributes, 'id' | 'role' | 'date_creation'>;

// Interface d'instance Sequelize avec méthodes personnalisées
export interface UtilisateurInstance
  extends Model<UtilisateurAttributes, UtilisateurCreationAttributes>,
    UtilisateurAttributes {
  comparePassword(password: string): Promise<boolean>;
}

// Fonction d'initialisation du modèle
export default function (sequelize: Sequelize): ModelStatic<UtilisateurInstance> {
  const Utilisateur = sequelize.define<UtilisateurInstance>(
    'utilisateur',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      prenom: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      mot_de_passe: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'utilisateur',
        validate: {
          isIn: [['admin', 'utilisateur']]
        }
      },
      date_creation: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'utilisateur', 
      timestamps: false          
    }
  );


  //Hooks de hashage du mot de passe
  Utilisateur.addHook('beforeCreate', async (user: any) => {
    // Empêche de re-hasher un mot de passe déjà hashé
    if (!user.mot_de_passe.startsWith('$2b$')) {
      user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 10);
    }
  });

  Utilisateur.addHook('beforeUpdate', async (user: any) => {
    if (user.changed('mot_de_passe')) {
      user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 10);
    }
  });

  //Méthode personnalisée pour comparer le mot de passe
  (Utilisateur as any).prototype.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, (this as any).mot_de_passe);
  };


  return Utilisateur;
}
