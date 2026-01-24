import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import db from './models';

const app: Express = express();

// Add security headers
app.use(helmet());

const corsOptions: cors.CorsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Built-in express middleware to parse JSON payloads
app.use(express.json({limit: '10mb'}));

// Built-in express middleware to parse URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// simple route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to CNAM application.' });
});

// Import routes
import initializeRoutes from './routes/index';

db.sequelize.sync()
  .then(() => {
    console.log('Synced db.');
    
    // Initialise les routes après synchronisation
    initializeRoutes(app);
    
    // Lance le serveur après tout
    const PORT: number = 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  })
  .catch((err: Error) => {
    console.log('Failed to sync db: ' + err.message);
  });