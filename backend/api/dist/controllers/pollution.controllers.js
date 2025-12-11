"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getOne = exports.getAll = void 0;
const models_1 = __importDefault(require("../models"));
const Pollution = models_1.default.pollution;
// Get all pollution records, optionally filtered by typePollution
const getAll = async (req, res) => {
    try {
        const type = req.query.typePollution;
        const condition = type ? { typePollution: type } : undefined;
        const data = await Pollution.findAll({ where: condition });
        res.status(200).json(data);
    }
    catch (err) {
        console.error("Erreur lors de la récupération des pollutions :", err);
        res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de la récupération des pollutions."
        });
    }
};
exports.getAll = getAll;
// Get a single pollution record by ID
const getOne = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Pollution.findByPk(id);
        if (data) {
            res.status(200).json(data);
        }
        else {
            res.status(404).json({ message: `Pollution with id=${id} not found.` });
        }
    }
    catch (err) {
        console.error("Erreur lors de la récupération de la pollution :", err);
        res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de la récupération de la pollution."
        });
    }
};
exports.getOne = getOne;
// Create a new pollution record
const create = async (req, res) => {
    try {
        // Validate request
        if (!req.body.titre) {
            res.status(400).json({
                message: "Le titre ne peut pas être vide!"
            });
            return;
        }
        // Create a Pollution instance
        const pollutionData = {
            titre: req.body.titre,
            lieu: req.body.lieu,
            date_observation: req.body.date_observation,
            type_pollution: req.body.type_pollution,
            description: req.body.description,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            photo_url: req.body.photo_url
        };
        const pollution = await Pollution.create(pollutionData);
        res.status(201).json(pollution);
    }
    catch (err) {
        console.error("Erreur lors de la création de la pollution :", err);
        res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de la création de la pollution."
        });
    }
};
exports.create = create;
// Update a pollution record by ID
const update = async (req, res) => {
    try {
        const id = req.params.id;
        // Validate if there's data to update
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({
                message: "Les données pour la mise à jour ne peuvent pas être vides!"
            });
            return;
        }
        const num = await Pollution.update(req.body, {
            where: { id }
        });
        if (num[0] === 1) {
            const updatedPollution = await Pollution.findByPk(id);
            res.status(200).json({
                message: "La pollution a été mise à jour avec succès.",
                data: updatedPollution
            });
        }
        else {
            res.status(404).json({
                message: `Impossible de mettre à jour la pollution avec id=${id}. La pollution n'a peut-être pas été trouvée.`
            });
        }
    }
    catch (err) {
        console.error("Erreur lors de la mise à jour de la pollution :", err);
        res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de la mise à jour de la pollution."
        });
    }
};
exports.update = update;
// Delete a pollution record by ID
const remove = async (req, res) => {
    try {
        const id = req.params.id;
        const num = await Pollution.destroy({
            where: { id }
        });
        if (num === 1) {
            res.status(200).json({
                message: "La pollution a été supprimée avec succès."
            });
        }
        else {
            res.status(404).json({
                message: `Impossible de supprimer la pollution avec id=${id}. La pollution n'a peut-être pas été trouvée.`
            });
        }
    }
    catch (err) {
        console.error("Erreur lors de la suppression de la pollution :", err);
        res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de la suppression de la pollution."
        });
    }
};
exports.remove = remove;
