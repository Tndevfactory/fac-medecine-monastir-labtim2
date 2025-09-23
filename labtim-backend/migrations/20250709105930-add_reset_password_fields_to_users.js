'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'resetPasswordToken', { // Changed from 'Users' to 'users'
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'resetPasswordExpire', { // Changed from 'Users' to 'users'
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'resetPasswordToken'); // Changed from 'Users' to 'users'
    await queryInterface.removeColumn('users', 'resetPasswordExpire'); // Changed from 'Users' to 'users'
  }
};
