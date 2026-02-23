const { Court, User } = require('../models');

exports.getAllCourts = async (req, res) => {
  try {
    const courts = await Court.findAll({ 
        include: { 
            model: User, 
            as: 'creator', 
            attributes: ['username'] 
        } 
    });
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener canchas', error: error.message });
  }
};

exports.createCourt = async (req, res) => {
  try {
    const { name, lat, lng, image, lighting } = req.body;
    
    // Validaciones básicas
    if (!name || !lat || !lng) {
        return res.status(400).json({ message: 'Faltan datos obligatorios (nombre, lat, lng)' });
    }

    const newCourt = await Court.create({
      name, 
      lat, 
      lng, 
      image, 
      lighting, 
      created_by: req.user.id // ID viene del token JWT (middleware)
    });

    res.status(201).json(newCourt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear cancha', error: error.message });
  }
};

exports.getCourtById = async (req, res) => {
    try {
        const court = await Court.findByPk(req.params.id, {
            include: { model: User, as: 'creator', attributes: ['username'] }
        });
        if (!court) return res.status(404).json({ message: 'Cancha no encontrada' });
        res.json(court);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalle de la cancha', error: error.message });
    }
};