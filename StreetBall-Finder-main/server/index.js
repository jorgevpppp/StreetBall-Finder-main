const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Reemplazando logs de db para producción)
app.use(cors());
app.use(express.json());

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const courtRoutes = require('./routes/courtRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/events', eventRoutes);

// Ruta raíz para evitar confusión
app.get('/', (req, res) => {
  res.send('<h1>Servidor Backend Funcionando 🚀</h1><p>Esta es la API. Para ver la web, visita <a href="http://localhost:5173">http://localhost:5173</a></p>');
});

// Database Sync and Server Start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL exitosa.');
    
    // Sync models (force: false para no borrar datos existentes)
    await sequelize.sync(); // alter: true disabled to prevent "Too many keys" error
    console.log('✅ Modelos sincronizados con la base de datos.');

    // Debug Routes
    console.log('Registered Routes:');
    console.log('- /api/auth');
    console.log('- /api/courts');
    console.log('- /api/events');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
  }
};

startServer();