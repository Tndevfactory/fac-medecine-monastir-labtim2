// models/PresentationContent.js

module.exports = (sequelize, DataTypes) => {
  const PresentationContent = sequelize.define('PresentationContent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sectionName: { // Unique identifier for the section (e.g., 'main_presentation')
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    contentBlocks: { // Stores flexible JSON array of text and image blocks
      type: DataTypes.TEXT, // Use TEXT to store JSON string
      allowNull: false,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('contentBlocks');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('contentBlocks', JSON.stringify(value));
      }
    },
    // NEW FIELDS FOR DYNAMIC CONTENT
    directorName: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if not set
      defaultValue: null,
    },
    directorPosition: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    directorImage: { // Path to the director's image
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    counter1Value: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    counter1Label: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Permanents',
    },
    counter2Value: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    counter2Label: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Articles impactés',
    },
    counter3Value: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    counter3Label: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Articles publiés',
    },
    // Add other fields from the original presentation.tsx as needed, e.g., 'mainThemesTitle'
    // For now, "Les principaux thèmes de nos équipes de recherche :" can remain static in the frontend for simplicity.
  }, {
    timestamps: true,
    tableName: 'presentation_content', // Explicit table name
  });

  return PresentationContent; // Return the defined model
};
