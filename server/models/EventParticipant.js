const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventParticipant = sequelize.define('EventParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  // event_id and user_id via associations
}, {
  timestamps: true,
});

module.exports = EventParticipant;
