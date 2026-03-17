import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Memory extends Model {
  declare id: string;
  declare userId: string;
  declare key: string | null;
  declare content: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Memory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Memory",
    timestamps: true,
    indexes: [
      { fields: ["id"] },
      { fields: ["userId"] },
      { fields: ["userId", "createdAt"] },
      { unique: true, fields: ["userId", "key"] },
    ],
  }
);

export default Memory;
