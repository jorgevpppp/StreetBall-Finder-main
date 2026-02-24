const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.get('/', eventController.getAllEvents);

// Protected
router.post('/', authMiddleware, eventController.createEvent);
router.post('/:id/join', authMiddleware, eventController.joinEvent);
router.post('/:id/leave', authMiddleware, eventController.leaveEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
