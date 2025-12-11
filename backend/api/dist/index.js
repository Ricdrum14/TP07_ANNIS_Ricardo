"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const models_1 = __importDefault(require("./models"));
const app = (0, express_1.default)();
// Add security headers
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
};
app.use((0, cors_1.default)(corsOptions));
// Built-in express middleware to parse JSON payloads
app.use(express_1.default.json({ limit: '10mb' }));
// Built-in express middleware to parse URL-encoded payloads
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// simple route
app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to CNAM application.' });
});
models_1.default.sequelize.sync()
    .then(() => {
    console.log('Synced db.');
})
    .catch((err) => {
    console.log('Failed to sync db: ' + err.message);
});
// Import routes
const index_1 = __importDefault(require("./routes/index"));
(0, index_1.default)(app);
// set port, listen for requests
const PORT = 443;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
