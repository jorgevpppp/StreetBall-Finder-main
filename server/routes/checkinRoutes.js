const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const authMiddleware = require('../middleware/authMiddleware');

// Check-in (ahora requiere autenticación nuevamente)
router.post('/', authMiddleware, checkinController.doCheckin);

// Ver check-ins activos (público)
router.get('/', checkinController.getActiveCheckins);

module.exports = router;