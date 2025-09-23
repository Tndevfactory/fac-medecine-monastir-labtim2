// models/User.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true, // REMOVED: This will be handled by manual index in server.js
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orcid: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true, // REMOVED: This will be handled by manual index in server.js
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expertises: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('expertises');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('expertises', JSON.stringify(value));
      }
    },
    researchInterests: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('researchInterests');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('researchInterests', JSON.stringify(value));
      }
    },
    universityEducation: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('universityEducation');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('universityEducation', JSON.stringify(value));
      }
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // NEW FIELDS FOR PASSWORD RESET
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if no reset is pending
    },
    resetPasswordExpire: {
      type: DataTypes.DATE, // Use DATE for exact timestamp, not DATEONLY
      allowNull: true, // Can be null if no reset is pending
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
    timestamps: true,
    tableName: 'users', // Ensure this matches your actual table name casing in DB
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Set initial expiration date if not provided
        if (!user.expirationDate) {
          const creationDate = user.createdAt || new Date();
          const initialExpiration = new Date(creationDate);
          initialExpiration.setFullYear(initialExpiration.getFullYear() + 5);
          user.expirationDate = initialExpiration.toISOString().split('T')[0];
        }
      },
      beforeUpdate: async (user, options) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }

        const profileFieldsChanged = [
          'name', 'position', 'phone', 'orcid', 'biography',
          'expertises', 'researchInterests', 'universityEducation', 'image'
        ].some(field => user.changed(field));

        if (profileFieldsChanged || user.changed('password')) {
          if (!options.fields || (options.fields && !options.fields.includes('expirationDate'))) {
              const now = new Date();
              const currentExpiration = user.expirationDate ? new Date(user.expirationDate) : null;

              if (!currentExpiration || currentExpiration <= now) {
                  const newExpiration = new Date();
                  newExpiration.setFullYear(newExpiration.getFullYear() + 5);
                  user.expirationDate = newExpiration.toISOString().split('T')[0];
              }
          }
        }
      },
    },
  });

  // Define an instance method for password comparison
  User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User.extendExpiration = async function (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      const newExpiration = new Date();
      newExpiration.setFullYear(newExpiration.getFullYear() + 5);
      user.expirationDate = newExpiration.toISOString().split('T')[0];
      await user.save({ fields: ['expirationDate'] });
      console.log(`Expiration date for user ${userId} extended to ${user.expirationDate}`);
    } else {
      console.warn(`User with ID ${userId} not found for expiration extension.`);
    }
  };


  // Define associations after the model is defined
  User.associate = function(models) {
    User.hasMany(models.Actu, {
      foreignKey: 'userId',
      as: 'createdActus',
    });
    User.hasMany(models.Publication, {
      foreignKey: 'userId',
      as: 'createdPublications',
    });
    User.hasMany(models.MasterSI, {
      foreignKey: 'userId',
      as: 'createdMasterPFEs',
    });
    User.hasMany(models.Thesis, {
      foreignKey: 'userId',
      as: 'createdTheses',
    });
  };

  return User;
};
