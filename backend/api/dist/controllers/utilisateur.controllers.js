"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getOne = exports.getAll = void 0;
const models_1 = __importDefault(require("../models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Utilisateur = models_1.default.utilisateur;
/** 🔹 Récupérer tous les utilisateurs */
const getAll = async (_req, res) => {
    try {
        const utilisateurs = await Utilisateur.findAll({
            attributes: { exclude: ['mot_de_passe'] }
        });
        res.status(200).json(utilisateurs);
    }
    catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.getAll = getAll;
/** 🔹 Récupérer un utilisateur par ID */
const getOne = async (req, res) => {
    try {
        const user = await Utilisateur.findByPk(req.params.id, {
            attributes: { exclude: ['mot_de_passe'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Erreur getOne utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.getOne = getOne;
const create = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, role } = req.body;
        if (!email || !mot_de_passe || !nom || !prenom) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }
        const exist = await Utilisateur.findOne({ where: { email } });
        if (exist) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }
        // ✅ Hash du mot de passe avant création
        const hashedPassword = await bcrypt_1.default.hash(mot_de_passe, 10);
        const user = await Utilisateur.create({
            nom,
            prenom,
            email,
            mot_de_passe: hashedPassword,
            role
        });
        const { mot_de_passe: _, ...userSansMDP } = user.toJSON();
        res.status(201).json(userSansMDP);
    }
    catch (error) {
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.create = create;
/** 🔹 Mettre à jour un utilisateur */
const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { email, mot_de_passe } = req.body;
        // ✅ Prépare les données à mettre à jour
        const dataToUpdate = {};
        if (email)
            dataToUpdate.email = email;
        // ✅ Si un mot de passe est fourni, on le hache avant mise à jour
        if (mot_de_passe) {
            const hashedPassword = await bcrypt_1.default.hash(mot_de_passe, 10);
            dataToUpdate.mot_de_passe = hashedPassword;
        }
        const [nbUpdated] = await Utilisateur.update(dataToUpdate, { where: { id } });
        if (nbUpdated === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou inchangé.' });
        }
        // ✅ On renvoie l’utilisateur sans le mot de passe
        const updated = await Utilisateur.findByPk(id, { attributes: { exclude: ['mot_de_passe'] } });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Erreur update utilisateur:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.update = update;
/** 🔹 Supprimer un utilisateur */
const remove = async (req, res) => {
    try {
        const nbDeleted = await Utilisateur.destroy({ where: { id: req.params.id } });
        if (nbDeleted === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    }
    catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.remove = remove;
