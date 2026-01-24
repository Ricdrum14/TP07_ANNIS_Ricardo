import express from 'express';
import { register, login } from '../controllers/auth.controllers';


const router = express.Router();

// Routes publiques (sans middleware JWT)
router.post('/register', register);
router.post('/login', login);



export default router;
