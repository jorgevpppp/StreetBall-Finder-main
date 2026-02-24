const { Event, User, Court, EventParticipant } = require('../models');

// List all events with related data
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar'] },
        { model: Court, attributes: ['id', 'name'] },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'avatar'],
          through: { attributes: ['count'] },
        },
      ],
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, type, court_id, max_participants } = req.body;
    if (!title || !date || !court_id) {
      return res
        .status(400)
        .json({ message: 'Faltan datos obligatorios (title, date, court_id)' });
    }

    const newEvent = await Event.create({
      title,
      description,
      date,
      type,
      court_id,
      max_participants,
      creator_id: req.user.id,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear evento', error: error.message });
  }
};

// User joins an event (or increases count)
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const people = req.body.count ? parseInt(req.body.count) : 1;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    const [participation, created] = await EventParticipant.findOrCreate({
      where: { event_id: eventId, user_id: userId },
      defaults: { count: people },
    });

    if (!created) {
      participation.count += people;
      await participation.save();
    }

    res.json({ message: 'Participación registrada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uniendo al evento', error: error.message });
  }
};

// User leaves an event
exports.leaveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const deleted = await EventParticipant.destroy({
      where: { event_id: eventId, user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Participación no encontrada' });
    }

    res.json({ message: 'Salió del evento' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saliendo del evento', error: error.message });
  }
};

// Delete event (only creator)
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (event.creator_id !== userId)
      return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });

    await event.destroy();
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error eliminando evento', error: error.message });
  }
};
