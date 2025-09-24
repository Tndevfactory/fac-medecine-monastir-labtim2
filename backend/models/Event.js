// models/Event.js

// Supprimez ces lignes
// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');

// Exportez une fonction qui définit le modèle
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING, // URL to the image
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING, // e.g., 'Conference', 'Workshop', 'Seminar'
      allowNull: true,
    },
    // Ajout du userId pour lier un événement à un utilisateur (si nécessaire)
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users', // <-- FIXED: Use 'users' (lowercase)
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  }, {
    timestamps: true,
    tableName: 'events', // Nom de table explicite
  });

  return Event; // Retournez le modèle défini
};
