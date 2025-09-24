// backend/models/Actu.js
'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Actu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // An Actu belongs to a User (its creator)
      Actu.belongsTo(models.User, { // 'models.User' refers to the User model loaded by index.js
        foreignKey: 'userId',      // This is the column in the Actus table
        as: 'creator',             // This alias is used in your controller's 'include' option
        onDelete: 'SET NULL',      // Matches your existing constraint
        onUpdate: 'CASCADE'        // Matches your existing constraint
      });
    }
  }
  Actu.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Conférence', 'Formation', 'Laboratoire'),
      allowNull: false,
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fullContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users', // Refers to the actual table name
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Actu', // This is the model name used in db.Actu
    tableName: 'Actus', // Explicitly define table name, though Sequelize often pluralizes models
    hooks: {
        beforeUpdate: (actu, options) => {
            actu.updatedAt = new Date();
        },
    },
  });
  return Actu;
};
