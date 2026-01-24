import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models';

const Utilisateur = db.utilisateur;

// Configuration
const JWT_SECRET: string = process.env.JWT_SECRET || 'ta_cle_secrete_ici';
const JWT_EXPIRATION: string = process.env.JWT_EXPIRATION || '2h'; // 2 heures (bonne pratique de sécurité)

// Regex patterns pour éviter les injections
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  nom: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  prenom: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
  password: /^.{8,}$/, // Minimum 8 caractères
};

/** 🔹 Inscription */
export const register = async (req: Request, res: Response) => {
  try {
    const { nom, prenom, email, mot_de_passe } = req.body;

    // Validation des champs requis
    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Validation avec regex
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

    // Vérifie si l'email existe déjà
    const exist = await Utilisateur.findOne({ where: { email } });
    if (exist) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Crée le nouvel utilisateur
    const newUser = await Utilisateur.create({
      nom,
      prenom,
      email,
      mot_de_passe, // le hook beforeCreate va le hasher automatiquement
      role: 'utilisateur'
    });

    const { mot_de_passe: _, ...userSansMDP } = newUser.toJSON();
    return res.status(201).json(userSansMDP);
  } catch (error) {
    console.error('Erreur register:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/** 🔹 Connexion */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    // Validation avec regex
    if (!patterns.email.test(email)) {
      return res.status(400).json({ message: 'Email invalide.' });
    }

    // Cherche l'utilisateur
    const user = await Utilisateur.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Compare le mot de passe
    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Génère le JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Supprime le mot de passe de la réponse
    const { mot_de_passe: _, ...userSansMDP } = user.toJSON();

    return res.status(200).json({
      token,
      user: userSansMDP
    });
  } catch (error) {
    console.error('Erreur login:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
