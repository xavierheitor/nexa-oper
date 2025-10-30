import { Router } from 'express';
import express from 'express';
import path from 'path';
import { config } from '../config/env';

const router = Router();

// Servir arquivos estáticos da pasta uploads
router.use('/', express.static(path.join(config.uploadDir)));

export { router as staticRouter };

