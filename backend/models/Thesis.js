// models/Thesis.js

module.exports = (sequelize, DataTypes) => {
  const Thesis = sequelize.define('Thesis', { // Model name is Thesis
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: { // Author of the thesis/HDR
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('HDR', 'These'), // HDR (Habilitation à Diriger des Recherches) or Thèse
      allowNull: false,
    },
    etablissement: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialite: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    encadrant: { // Supervisor
      type: DataTypes.STRING,
      allowNull: false,
    },
    membres: { // Jury members, stored as JSON string (array of strings)
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('membres');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('membres', JSON.stringify(value));
      }
    },
    // Link to User if a member can add their own theses
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if user is deleted or not associated
      references: {
        model: 'users', // references the 'users' table (lowercase)
        key: 'id',
      },
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
    tableName: 'theses', // Ensure table name is lowercase and plural
    // Optionally add indexes
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['year'],
      },
    ]
  });

  Thesis.associate = function(models) {
    // Thesis belongs to a User
    Thesis.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'creator', // Alias for fetching the user who added the thesis
    });
  };

  return Thesis;
};
