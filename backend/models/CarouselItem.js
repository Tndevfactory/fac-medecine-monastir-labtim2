// models/CarouselItem.js

// Supprimez ces lignes
// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');

// Exportez une fonction qui définit le modèle
module.exports = (sequelize, DataTypes) => {
  const CarouselItem = sequelize.define('CarouselItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: { // For controlling the display order of carousel items
      type: DataTypes.INTEGER,
      allowNull: false,
      // unique: true, // Each order number should be unique
    },
    link: { // Optional: Link associated with the carousel item
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'carousel_items', // Nom de table explicite
  });

  return CarouselItem; // Retournez le modèle défini
};
