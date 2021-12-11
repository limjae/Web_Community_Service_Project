const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Post = require('./post');
const Image = require('./image');
const Message = require('./message');
const Verifycode = require('./verifycode');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Image = Image;
db.Message = Message;
db.Verifycode = Verifycode;

User.init(sequelize);
Post.init(sequelize);
Image.init(sequelize);
Message.init(sequelize);
Verifycode.init(sequelize);

User.associate(db);
Post.associate(db);
Image.associate(db);
Message.associate(db);
Verifycode.associate(db);

module.exports = db;
