import { Request, Response } from 'express';
import db from '../models';
import { UtilisateurAttributes } from '../models/utilisateur.model';
import bcrypt from 'bcrypt';

const Utilisateur = db.utilisateur;

// Regex patterns pour éviter les injections
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  nom: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  prenom: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  password: /^.{8,}$/, // Minimum 8 caractères
  id: /^\d+$/, // Numérique
};

// -------------------------------
// Helpers auth / roles
// -------------------------------
function getAuthUser(req: Request): { id: number; role?: string } | null {
  const u: any = (req as any).user;
  if (!u || !u.id) return null;
  return { id: Number(u.id), role: u.role };
}

function isAdmin(req: Request): boolean {
  const u = getAuthUser(req);
  return u?.role === 'admin';
}

function canAccessUser(req: Request, targetUserId: string): boolean {
  const auth = getAuthUser(req);
  if (!auth) return false;
  if (isAdmin(req)) return true;
  return auth.id === Number(targetUserId);
}

/** 🔹 Récupérer tous les utilisateurs (ADMIN ONLY) */
export const getAll = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });
    if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé (admin uniquement)' });

    const utilisateurs = await Utilisateur.findAll({
      attributes: { exclude: ['mot_de_passe'] }
    });
    return res.status(200).json(utilisateurs);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/** 🔹 Récupérer un utilisateur par ID (ADMIN ou SOI-MÊME) */
export const getOne = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    if (!canAccessUser(req, id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const user = await Utilisateur.findByPk(id, {
      attributes: { exclude: ['mot_de_passe'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Erreur getOne utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * 🔹 Créer un utilisateur (ADMIN ONLY)
 * Remarque: en "vraie app", l’inscription passe par /api/auth/register
 */
export const create = async (req: Request<{}, {}, UtilisateurAttributes>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });
    if (!isAdmin(req)) return res.status(403).json({ message: 'Accès refusé (admin uniquement)' });

    const { nom, prenom, email, mot_de_passe, role } = req.body;

    if (!email || !mot_de_passe || !nom || !prenom) {
      return res.status(400).json({ message: 'Champs requis manquants.' });
    }

    if (!patterns.email.test(email)) {
      return res.status(400).json({ message: 'Email invalide.' });
    }
    if (!patterns.nom.test(nom)) {
      return res.status(400).json({ message: 'Nom invalide (2-50 caractères).' });
    }
    if (!patterns.prenom.test(prenom)) {
      return res.status(400).json({ message: 'Prénom invalide (2-50 caractères).' });
    }
    if (!patterns.password.test(mot_de_passe)) {
      return res.status(400).json({ message: 'Mot de passe doit contenir au minimum 8 caractères.' });
    }

    const exist = await Utilisateur.findOne({ where: { email } });
    if (exist) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // ⚠️ Empêcher qu'un non-admin crée un admin (déjà couvert par admin-only)
    const safeRole = role && ['admin', 'utilisateur'].includes(role) ? role : 'utilisateur';

    const user = await Utilisateur.create({
      nom,
      prenom,
      email,
      mot_de_passe: hashedPassword,
      role: safeRole as any
    });

    const { mot_de_passe: _, ...userSansMDP } = user.toJSON();
    return res.status(201).json(userSansMDP);
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/** 🔹 Mettre à jour un utilisateur (ADMIN ou SOI-MÊME) */
export const update = async (
  req: Request<{ id: string }, {}, Partial<{ email: string; mot_de_passe: string }>>,
  res: Response
) => {
  try {
    const id = req.params.id;

    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    if (!canAccessUser(req, id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { email, mot_de_passe } = req.body;

    const dataToUpdate: any = {};

    if (email) {
      if (!patterns.email.test(email)) {
        return res.status(400).json({ message: 'Email invalide.' });
      }
      dataToUpdate.email = email;
    }

    if (mot_de_passe) {
      if (!patterns.password.test(mot_de_passe)) {
        return res.status(400).json({ message: 'Mot de passe doit contenir au minimum 8 caractères.' });
      }
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      dataToUpdate.mot_de_passe = hashedPassword;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'Aucune donnée valide à mettre à jour.' });
    }

    // Update
    const [nbUpdated] = await Utilisateur.update(dataToUpdate, { where: { id } });

    if (nbUpdated === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé ou inchangé.' });
    }

    const updated = await Utilisateur.findByPk(id, { attributes: { exclude: ['mot_de_passe'] } });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Erreur update utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/** 🔹 Supprimer un utilisateur (ADMIN ou SOI-MÊME) */
export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    if (!canAccessUser(req, id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const nbDeleted = await Utilisateur.destroy({ where: { id } });

    if (nbDeleted === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Postgres fera le ON DELETE CASCADE sur pollution si ta FK est bien en place
    return res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
