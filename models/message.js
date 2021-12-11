const Sequelize = require('sequelize');

module.exports = class Message extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      msg: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Message',
      tableName: 'messages',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }
  static associate(db) {
    db.Message.belongsTo(db.User,{foreignKey:'senderId', targetKey:'id', as:'sender'});
    db.Message.belongsTo(db.User,{foreignKey:'receiverId', targetKey:'id',  as:'receiver'});
  }
};
