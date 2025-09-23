// backend/models/Hero.js
module.exports = (sequelize, DataTypes) => {
  const Hero = sequelize.define('Hero', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for flexibility, but frontend can enforce
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    buttonContent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true, // Path to the uploaded image
    },
    // We don't need 'order' for a single hero section
    // No associations needed for Hero model as it's a standalone section
  }, {
    timestamps: true, // Adds createdAt and updatedAt
    tableName: 'heroes', // Explicitly set table name
    hooks: {
      // Optional: A hook to enforce single entry, though controller logic is more robust
      // beforeCreate: async (hero, options) => {
      //   const existingHeroCount = await Hero.count();
      //   if (existingHeroCount > 0) {
      //     throw new Error('Only one Hero section is allowed.');
      //   }
      // }
    }
  });

  // No associations for Hero as it's a single, standalone record.

  return Hero;
};
