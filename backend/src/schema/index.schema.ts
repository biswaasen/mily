import sequelize from "../config/database.js";
import User from "./user.schema.js";
import Message from "./message.schema.js";
import Subscription from "./subscription.schema.js";
import Memory from "./memory.schema.js";

User.hasMany(Message, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "messages",
});

Message.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Subscription, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "subscriptions",
});

Subscription.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Memory, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  as: "memories",
});

Memory.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export { sequelize, User, Message, Subscription, Memory };