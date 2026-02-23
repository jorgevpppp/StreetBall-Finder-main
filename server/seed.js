const { sequelize, Court, User } = require('./models');

const courtsData = [
    { 
        name: 'Parque del Retiro', 
        lat: 40.4153, 
        lng: -3.6844, 
        rating: 5, 
        lighting: true, 
        address: 'Plaza de la Independencia, 7',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Basketball_court_in_shimokitazawa.jpg/640px-Basketball_court_in_shimokitazawa.jpg'
    },
    { 
        name: 'Cancha Rio Manzanares', 
        lat: 40.3950, 
        lng: -3.7040, 
        rating: 4, 
        lighting: false, 
        address: 'Madrid Río - Zona Matadero',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Basketball_court_at_Rucker_Park.jpg/640px-Basketball_court_at_Rucker_Park.jpg'
    },
    { 
        name: 'Polideportivo La Elipa', 
        lat: 40.4286, 
        lng: -3.6495, 
        rating: 3, 
        lighting: true, 
        address: 'Calle de Sta. Irene',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Basketball_court_Resulo.jpg/640px-Basketball_court_Resulo.jpg'
    },
    { 
        name: 'Parque de Atenas', 
        lat: 40.4125, 
        lng: -3.7196, 
        rating: 4, 
        lighting: true, 
        address: 'Calle de Segovia, s/n',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Basketball_court.jpg/640px-Basketball_court.jpg'
    },
    { 
        name: 'Instalación D. Pradolongo', 
        lat: 40.3800, 
        lng: -3.7083, 
        rating: 3, 
        lighting: false, 
        address: 'Parque Pradolongo',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Basketball_in_Beijing.jpg/640px-Basketball_in_Beijing.jpg'
    },
    { 
        name: 'Cancha Vallecas', 
        lat: 40.3916, 
        lng: -3.6601, 
        rating: 5, 
        lighting: true, 
        address: 'Calle del Payaso Fofó',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Basketball_hoop_at_sunset.jpg/640px-Basketball_hoop_at_sunset.jpg'
    },
    { 
        name: 'Pista Casino de la Reina', 
        lat: 40.4072, 
        lng: -3.7038, 
        rating: 4, 
        lighting: true, 
        address: 'Calle de Embajadores',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Basketball_court_-_panoramio.jpg/640px-Basketball_court_-_panoramio.jpg'
    },
    { 
        name: 'Parque Rodríguez Sahagún', 
        lat: 40.4632, 
        lng: -3.7099, 
        rating: 4, 
        lighting: false, 
        address: 'Paseo de la Dirección',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Basketball_court_in_Hong_Kong.jpg/640px-Basketball_court_in_Hong_Kong.jpg'
    },
    { 
        name: 'Cancha Parque Eva Perón', 
        lat: 40.4295, 
        lng: -3.6655, 
        rating: 3, 
        lighting: true, 
        address: 'Plaza de Manuel Becerra',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Streetball_Court_Berlin.jpg/640px-Streetball_Court_Berlin.jpg'
    }
];

const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('🔗 Conectado a la Base de Datos.');
        
        // Sincronizar modelos (force: true RECREA las tablas desde cero para aplicar cambios de columnas)
        await sequelize.sync({ force: true });
        console.log('♻️  Tablas recreadas (Schema actualizado).');

        // Crear un usuario dummy si no existe para asignar las pistas
        const [adminUser] = await User.findOrCreate({
            where: { email: 'admin@streetball.com' },
            defaults: {
                username: 'AdminBasket',
                password: 'password123', // En producción esto iría hasheado
                email: 'admin@streetball.com'
            }
        });

        console.log(`👤 Usuario Admin garantizado: ${adminUser.username}`);

        // Borrar pistas existentes para no duplicar en cada ejecución (opcional)
        // await Court.destroy({ where: {} }); 
        // console.log('🗑️  Datos anteriores limpios.');

        // Crear las pistas
        for (const court of courtsData) {
            await Court.create({
                ...court,
                created_by: adminUser.id
            });
        }

        console.log(`✅ ¡Éxito! Se han insertado ${courtsData.length} pistas en MySQL.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al insertar datos:', error);
        process.exit(1);
    }
};

seedDatabase();
