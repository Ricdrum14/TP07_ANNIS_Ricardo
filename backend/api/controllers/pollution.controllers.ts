import { Request, Response } from 'express';
import db from '../models';
import { PollutionAttributes } from '../models/pollution.model';

const Pollution = db.pollution;

// Regex patterns pour éviter les injections
const patterns = {
  id: /^\d+$/,
  titre: /^[a-zA-Z0-9\s\-,'àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ.()]{2,200}$/,
  typePollution: /^[a-zA-Z\s\-]{2,50}$/,
  latitude: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
  longitude: /^-?(180|1[0-7][0-9]|[0-9]{1,2})(\.[0-9]{1,6})?$/,
  url: /^(https?:\/\/)?.+\..+$/,
};

interface PollutionQuery {
  typePollution?: string;
}

type CreatePollutionBody = Partial<Omit<PollutionAttributes, 'id'>> & {
  titre: string;
};

// -------------------------------
// Helpers auth / ownership
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

// -------------------------------
// GET ALL (public)
// -------------------------------
export const getAll = async (req: Request<{}, {}, {}, PollutionQuery>, res: Response) => {
  try {
    const type = req.query.typePollution;

    // ✅ Correction : le champ s'appelle type_pollution en DB
    const condition = type ? { type_pollution: type } : undefined;

    const data = await Pollution.findAll({
      where: condition,
      include: [
        {
          model: db.utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role'],
        },
      ],
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur lors de la récupération des pollutions :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des pollutions.',
    });
  }
};

// -------------------------------
// GET ONE (public)
// -------------------------------
export const getOne = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const data = await Pollution.findByPk(id, {
      include: [
        {
          model: db.utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role'],
        },
      ],
    });

    if (data) {
      return res.status(200).json(data);
    }

    return res.status(404).json({ message: `Pollution with id=${id} not found.` });
  } catch (err) {
    console.error('Erreur lors de la récupération de la pollution :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération de la pollution.',
    });
  }
};

// -------------------------------
// GET MINE (JWT required)
// -------------------------------
export const getMine = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    const data = await Pollution.findAll({
      where: { utilisateur_id: auth.id },
      include: [
        {
          model: db.utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur lors de la récupération des pollutions de l’utilisateur :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
    });
  }
};

// -------------------------------
// CREATE (JWT required)
// -------------------------------
export const create = async (req: Request<{}, {}, CreatePollutionBody>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!req.body.titre) {
      return res.status(400).json({ message: 'Le titre ne peut pas être vide!' });
    }

    if (!patterns.titre.test(req.body.titre)) {
      return res.status(400).json({ message: 'Le titre contient des caractères invalides!' });
    }

    if (req.body.latitude && !patterns.latitude.test(req.body.latitude.toString())) {
      return res.status(400).json({ message: 'Latitude invalide!' });
    }

    if (req.body.longitude && !patterns.longitude.test(req.body.longitude.toString())) {
      return res.status(400).json({ message: 'Longitude invalide!' });
    }

    if (req.body.photo_url && !patterns.url.test(req.body.photo_url)) {
      return res.status(400).json({ message: 'URL de photo invalide!' });
    }

    // ✅ utilisateur_id vient du token (pas du front)
    const pollutionData: any = {
      titre: req.body.titre,
      lieu: req.body.lieu,
      date_observation: req.body.date_observation,
      type_pollution: req.body.type_pollution,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      photo_url: req.body.photo_url,
      utilisateur_id: auth.id,
    };

    const pollution = await Pollution.create(pollutionData);
    return res.status(201).json(pollution);
  } catch (err) {
    console.error('Erreur lors de la création de la pollution :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la pollution.',
    });
  }
};

// -------------------------------
// UPDATE (JWT required - owner, admin can bypass)
// -------------------------------
export const update = async (req: Request<{ id: string }, {}, Partial<CreatePollutionBody>>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    const id = req.params.id;

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Les données pour la mise à jour ne peuvent pas être vides!' });
    }

    if (req.body.titre && !patterns.titre.test(req.body.titre)) {
      return res.status(400).json({ message: 'Le titre contient des caractères invalides!' });
    }

    if (req.body.latitude && !patterns.latitude.test(req.body.latitude.toString())) {
      return res.status(400).json({ message: 'Latitude invalide!' });
    }

    if (req.body.longitude && !patterns.longitude.test(req.body.longitude.toString())) {
      return res.status(400).json({ message: 'Longitude invalide!' });
    }

    if (req.body.photo_url && !patterns.url.test(req.body.photo_url)) {
      return res.status(400).json({ message: 'URL de photo invalide!' });
    }

    const where: any = { id };
    if (!isAdmin(req)) {
      where.utilisateur_id = auth.id;
    }

    const num = await Pollution.update(req.body, { where });

    if (num[0] === 1) {
      const updatedPollution = await Pollution.findByPk(id, {
        include: [
          {
            model: db.utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'nom', 'prenom', 'email', 'role'],
          },
        ],
      });

      return res.status(200).json({
        message: 'La pollution a été mise à jour avec succès.',
        data: updatedPollution,
      });
    }

    if (!isAdmin(req)) {
      return res.status(403).json({
        message: 'Accès refusé : vous ne pouvez modifier que vos propres pollutions (ou pollution introuvable).',
      });
    }

    return res.status(404).json({
      message: `Impossible de mettre à jour la pollution avec id=${id}. La pollution n'a peut-être pas été trouvée.`,
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la pollution :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Une erreur est survenue lors de la mise à jour de la pollution.",
    });
  }
};

// -------------------------------
// DELETE (JWT required - owner, admin can bypass)
// -------------------------------
export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    const id = req.params.id;

    if (!patterns.id.test(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const where: any = { id };
    if (!isAdmin(req)) {
      where.utilisateur_id = auth.id;
    }

    const num = await Pollution.destroy({ where });

    if (num === 1) {
      return res.status(200).json({ message: 'La pollution a été supprimée avec succès.' });
    }

    if (!isAdmin(req)) {
      return res.status(403).json({
        message: 'Accès refusé : vous ne pouvez supprimer que vos propres pollutions (ou pollution introuvable).',
      });
    }

    return res.status(404).json({
      message: `Impossible de supprimer la pollution avec id=${id}. La pollution n'a peut-être pas été trouvée.`,
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de la pollution :', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression de la pollution.',
    });
  }
};
