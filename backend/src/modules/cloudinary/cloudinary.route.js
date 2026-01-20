import Router from 'express';
import { signUpload, testConnection } from './cloudinary.controller.js';

const router = Router();

// Server-side signature endpoint for client direct uploads
router.post('/signature', signUpload);
// Diagnostic: run small upload+delete test
router.get('/test', testConnection);

export default router;
