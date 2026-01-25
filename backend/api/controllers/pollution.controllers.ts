import { Request, Response } from 'express';
import db from '../models';
import { PollutionAttributes } from '../models/pollution.model';
import { Op, Sequelize } from 'sequelize';

const Pollution = db.pollution;

const patterns = {
  id: /^\d+$/,
  titre: /^[a-zA-Z0-9\s\-,'àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ.()]{2,200}$/,
  latitude: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
  longitude: /^-?(180|1[0-7][0-9]|[0-9]{1,2})(\.[0-9]{1,6})?$/,
  url: /^(https?:\/\/)?.+\..+$/,
};

interface PollutionQuery {
  typePollution?: string;
  q?: string;
}

type CreatePollutionBody = Partial<Omit<PollutionAttributes, 'id'>> & {
  titre: string;
};

function getAuthUser(req: Request): { id: number; role?: string } | null {
  const u: any = (req as any).user;
  if (!u || !u.id) return null;
  return { id: Number(u.id), role: u.role };
}

function isAdmin(req: Request): boolean {
  const u = getAuthUser(req);
  return u?.role === 'admin';
}

// ✅ helper search cross-db (SQLite/Postgres)
function buildSearchWhere(q: string) {
  const qq = q.toLowerCase();
  const like = `%${qq}%`;

  // LOWER(titre) LIKE '%q%' OR LOWER(lieu) LIKE ... OR LOWER(description) LIKE ...
  return {
    [Op.or]: [
      Sequelize.where(Sequelize.fn('lower', Sequelize.col('titre')), { [Op.like]: like }),
      Sequelize.where(Sequelize.fn('lower', Sequelize.col('lieu')), { [Op.like]: like }),
      Sequelize.where(Sequelize.fn('lower', Sequelize.col('description')), { [Op.like]: like }),
    ],
  };
}

// -------------------------------
// GET ALL + SEARCH
// GET /api/pollutions?q=...&typePollution=...
// -------------------------------
export const getAll = async (req: Request<{}, {}, {}, PollutionQuery>, res: Response) => {
  try {
    const type = (req.query.typePollution ?? '').trim();
    const q = (req.query.q ?? '').trim();

    const where: any = {};

    if (type) where.type_pollution = type;
    if (q) Object.assign(where, buildSearchWhere(q));

    const data = await Pollution.findAll({
      where,
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
    console.error('Erreur getAll:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
    });
  }
};

// -------------------------------
// GET ONE (public)
// -------------------------------
export const getOne = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id;

    if (!patterns.id.test(id)) return res.status(400).json({ message: 'ID invalide' });

    const data = await Pollution.findByPk(id, {
      include: [
        {
          model: db.utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role'],
        },
      ],
    });

    if (!data) return res.status(404).json({ message: `Pollution with id=${id} not found.` });
    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur getOne:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
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
    console.error('Erreur getMine:', err);
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
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    if (!req.body.titre) return res.status(400).json({ message: 'Le titre ne peut pas être vide!' });
    if (!patterns.titre.test(req.body.titre)) return res.status(400).json({ message: 'Titre invalide.' });

    if (req.body.latitude && !patterns.latitude.test(req.body.latitude.toString())) {
      return res.status(400).json({ message: 'Latitude invalide!' });
    }
    if (req.body.longitude && !patterns.longitude.test(req.body.longitude.toString())) {
      return res.status(400).json({ message: 'Longitude invalide!' });
    }
    if (req.body.photo_url && !patterns.url.test(req.body.photo_url)) {
      return res.status(400).json({ message: 'URL de photo invalide!' });
    }

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
    console.error('Erreur create:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
    });
  }
};

// -------------------------------
// UPDATE (JWT required - owner/admin)
// -------------------------------
export const update = async (req: Request<{ id: string }, {}, Partial<CreatePollutionBody>>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    const id = req.params.id;
    if (!patterns.id.test(id)) return res.status(400).json({ message: 'ID invalide' });

    const where: any = { id };
    if (!isAdmin(req)) where.utilisateur_id = auth.id;

    const num = await Pollution.update(req.body, { where });

    if (num[0] !== 1) {
      return res.status(!isAdmin(req) ? 403 : 404).json({
        message: !isAdmin(req)
          ? 'Accès refusé : vous ne pouvez modifier que vos propres pollutions (ou pollution introuvable).'
          : `Impossible de mettre à jour la pollution avec id=${id}.`,
      });
    }

    const updatedPollution = await Pollution.findByPk(id, {
      include: [{ model: db.utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'email', 'role'] }],
    });

    return res.status(200).json({ message: 'La pollution a été mise à jour avec succès.', data: updatedPollution });
  } catch (err) {
    console.error('Erreur update:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
    });
  }
};

// -------------------------------
// DELETE (JWT required - owner/admin)
// -------------------------------
export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Non authentifié' });

    const id = req.params.id;
    if (!patterns.id.test(id)) return res.status(400).json({ message: 'ID invalide' });

    const where: any = { id };
    if (!isAdmin(req)) where.utilisateur_id = auth.id;

    const num = await Pollution.destroy({ where });

    if (num !== 1) {
      return res.status(!isAdmin(req) ? 403 : 404).json({
        message: !isAdmin(req)
          ? 'Accès refusé : vous ne pouvez supprimer que vos propres pollutions (ou pollution introuvable).'
          : `Impossible de supprimer la pollution avec id=${id}.`,
      });
    }

    return res.status(200).json({ message: 'La pollution a été supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur remove:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Erreur serveur.',
    });
  }
};
