"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pollution_routes_1 = __importDefault(require("./pollution.routes"));
const utilisateur_routes_1 = __importDefault(require("./utilisateur.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
exports.default = (app) => {
    (0, pollution_routes_1.default)(app);
    (0, utilisateur_routes_1.default)(app);
    app.use('/api/auth', auth_routes_1.default);
};
