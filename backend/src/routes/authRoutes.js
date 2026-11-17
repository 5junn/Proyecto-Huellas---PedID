// backend/src/routes/authRoutes.js
import express from 'express';
const router = express.Router();

// Router de autenticación opcional si se desea modularizar
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

export default router;
