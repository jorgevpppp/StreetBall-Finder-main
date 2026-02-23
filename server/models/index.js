const sequelize = require('../config/database');
const User = require('./User');
const Court = require('./Court');
const Checkin = require('./Checkin');
const Event = require('./Event');
const EventParticipant = require('./EventParticipant');

// Associations

// User creates Courts
User.hasMany(Court, { foreignKey: 'created_by', as: 'createdCourts' });
Court.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User does Checkin
User.hasOne(Checkin, { foreignKey: 'user_id' });
Checkin.belongsTo(User, { foreignKey: 'user_id' });

// Court has Checkins
Court.hasMany(Checkin, { foreignKey: 'court_id' });
Checkin.belongsTo(Court, { foreignKey: 'court_id' });

// Event relationships
User.hasMany(Event, { foreignKey: 'creator_id', as: 'createdEvents' });
Event.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

Court.hasMany(Event, { foreignKey: 'court_id' });
Event.belongsTo(Court, { foreignKey: 'court_id' });

// Multiple Users participate in Multiple Events (Many-to-Many via EventParticipant)
User.belongsToMany(Event, { through: EventParticipant, foreignKey: 'user_id', as: 'ParticipatingEvents' });
Event.belongsToMany(User, { through: EventParticipant, foreignKey: 'event_id', as: 'participants' });

module.exports = {
  sequelize,
  User,
  Court,
  Checkin,
  Event,
  EventParticipant
};