const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checkin = sequelize.define('Checkin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  people_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  // user_id and court_id FKs will be handled in associations
}, {
  timestamps: true,
});

module.exports = Checkin;