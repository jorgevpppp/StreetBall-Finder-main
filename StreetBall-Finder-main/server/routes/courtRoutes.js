const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas Públicas
router.get('/', courtController.getAllCourts);
router.get('/:id', courtController.getCourtById);

// Rutas Privadas (Requieren Token)
router.post('/', authMiddleware, courtController.createCourt);

module.exports = router;