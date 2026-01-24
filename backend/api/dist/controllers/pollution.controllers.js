"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOne = exports.getAll = void 0;
const models_1 = __importDefault(require("../models"));
const Pollution = models_1.default.pollution;
const getAll = async (req, res) => {
    try {
        const type = req.query.type_pollution;
        const condition = type ? { type_pollution: type } : undefined;
        const data = await Pollution.findAll({ where: condition });
        res.status(200).json(data);
    }
    catch (err) {
        console.error("Erreur lors de la récupération des pollutions :", err);
        res.status(500).json({
            message: err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération des pollutions.",
        });
    }
};
exports.getAll = getAll;
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
            message: err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération de la pollution.",
        });
    }
};
exports.getOne = getOne;
