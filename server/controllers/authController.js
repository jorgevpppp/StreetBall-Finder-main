const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    const { username, email, password, position } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      position
    });

    res.status(201).json({ message: 'Usuario registrado con éxito', userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Generar Token JWT
    const token = jwt.sign(
        { id: user.id, username: user.username }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );

    res.json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            position: user.position, 
            avatar: user.avatar 
        } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el login', error: error.message });
  }
};