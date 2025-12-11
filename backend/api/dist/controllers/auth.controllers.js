"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const models_1 = __importDefault(require("../models"));
const Utilisateur = models_1.default.utilisateur;
/** 🔹 Inscription */
const register = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe } = req.body;
        if (!nom || !prenom || !email || !mot_de_passe) {
            return res.status(400).json({ message: 'Tous les champs sont requis.' });
        }
        const exist = await Utilisateur.findOne({ where: { email } });
        if (exist) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }
        const newUser = await Utilisateur.create({
            nom,
            prenom,
            email,
            mot_de_passe, // le hook beforeCreate va le hasher automatiquement
            role: 'utilisateur'
        });
        const { mot_de_passe: _, ...userSansMDP } = newUser.toJSON();
        return res.status(201).json(userSansMDP);
    }
    catch (error) {
        console.error('Erreur register:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.register = register;
/** 🔹 Connexion */
const login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;
        if (!email || !mot_de_passe) {
            return res.status(400).json({ message: 'Email et mot de passe requis.' });
        }
        // Cherche l’utilisateur
        const user = await Utilisateur.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        // Compare le mot de passe
        const isMatch = await bcrypt_1.default.compare(mot_de_passe, user.mot_de_passe);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect.' });
        }
        // Supprime le mot de passe de la réponse
        const { mot_de_passe: _, ...userSansMDP } = user.toJSON();
        return res.status(200).json(userSansMDP);
    }
    catch (error) {
        console.error('Erreur login:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.login = login;
