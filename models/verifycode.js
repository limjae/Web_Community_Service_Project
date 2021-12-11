const Sequelize = require('sequelize');

module.exports = class Verifycode extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      forId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Verifycode',
      tableName: 'verifycodes',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {}
};
