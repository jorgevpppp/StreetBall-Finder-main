const { Checkin, User, Court } = require('../models');
const { Op } = require('sequelize');

exports.doCheckin = async (req, res) => {
  try {
    const { court_id, count } = req.body;
    
    // AuthMiddleware garantiza que req.user exista
    const userId = req.user.id;
    const peopleCount = count ? parseInt(count) : 1;

    if (!court_id) return res.status(400).json({ message: 'court_id es requerido' });

    // Buscar si ya existe un check-in ACTIVO para este usuario
    const existingCheckin = await Checkin.findOne({ 
        where: { 
            user_id: userId,
            expires_at: { [Op.gt]: new Date() } // Solo si no ha expirado
        } 
    });

    // Limpiar checkins caducados o de otras pistas para este usuario
    // (Podríamos borrar todos los checkins del usuario, excepto el que vamos a actualizar, pero aquí vamos a crear uno nuevo)
    await Checkin.destroy({ where: { user_id: userId } }); 

    let finalCount = peopleCount;
    // Si existía checkin activo previo en la MISMA pista, sumamos la cantidad
    if (existingCheckin && existingCheckin.court_id == court_id) {
        finalCount += existingCheckin.people_count;
    }

    // Calcular expiración (2 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); 

    const newCheckin = await Checkin.create({
      user_id: userId,
      court_id,
      people_count: finalCount,
      expires_at: expiresAt
    });

    res.status(201).json({ message: 'Check-in realizado', checkin: newCheckin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al hacer check-in', error: error.message });
  }
};

exports.getActiveCheckins = async (req, res) => {
    try {
        const now = new Date();
        const activeCheckins = await Checkin.findAll({
            where: { expires_at: { [Op.gt]: now } }, // Expira en el futuro
            include: [
                { model: User, attributes: ['id', 'username', 'avatar', 'position'] },
                { model: Court, attributes: ['id', 'name'] }
            ]
        });
        
        res.json(activeCheckins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo checkins', error: error.message });
    }
}