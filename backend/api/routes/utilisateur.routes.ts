import express, { Router } from 'express';
import * as utilisateur from '../controllers/utilisateur.controllers';
import jwtMiddleware from '../middlewares/jwtMiddleware';

const router: Router = express.Router();

// Routes protégées par JWT
router.get('/', jwtMiddleware, utilisateur.getAll);
router.get('/:id', jwtMiddleware, utilisateur.getOne);
router.post('/', jwtMiddleware, utilisateur.create);
router.put('/:id', jwtMiddleware, utilisateur.update);
router.delete('/:id', jwtMiddleware, utilisateur.remove);

export default (app: express.Application): void => {
  app.use('/api/utilisateurs', router);
};
