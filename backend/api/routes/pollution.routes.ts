import express, { Router } from 'express';
import * as pollution from '../controllers/pollution.controllers';
import jwtMiddleware from '../middlewares/jwtMiddleware';

const router: Router = express.Router();

// Routes protégées par JWT
router.get("/", pollution.getAll); // Retrieve all pollution entries
router.get("/me", jwtMiddleware, pollution.getMine); // Retrieve pollution entries for the authenticated user
router.get("/:id", pollution.getOne); // Retrieve a single pollution entry by id
router.post("/", jwtMiddleware, pollution.create); // Create a new pollution entry
router.put("/:id", jwtMiddleware, pollution.update); // Update a pollution entry by id
router.delete("/:id", jwtMiddleware, pollution.remove); // Delete a pollution entry by id

export default (app: express.Application): void => {
    app.use('/api/pollutions', router); // Prefix all routes with /api/pollution
};