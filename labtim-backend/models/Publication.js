// models/Publication.js

module.exports = (sequelize, DataTypes) => {
  const Publication = sequelize.define('Publication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authors: { // Stored as JSON string (array of strings)
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('authors');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('authors', JSON.stringify(value));
      }
    },
    journal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    volume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pages: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    doi: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true, // DOI should be unique
    },
    // Removed the 'url' field as per your request
    // url: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    //   validate: {
    //     isUrl: true,
    //   },
    // },
    // Foreign key for User (who added this publication)
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
    tableName: 'publications', // Ensure table name is lowercase and plural
    // Optionally add indexes for frequently queried columns
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['year'],
      },
    ]
  });

  Publication.associate = function(models) {
    // Publication belongs to a User
    Publication.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'creator', // Alias for fetching the user who added the publication
    });
  };

  return Publication;
};
