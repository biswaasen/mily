import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Message extends Model {
  declare id: string;
  declare userId: string;
  declare query: string;
  declare response: string;
  declare intent: "transcribe" | "generate" | "command";
  declare tokens: number;
  declare audio: string | null;
  declare source: "desktop" | "mobile" | "web";
  declare error: string | null;
  declare metadata: Record<string, any> | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Message.init(
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
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "transcribe",
    },
    tokens: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    audio: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: "desktop",
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Message",
    timestamps: true,
    indexes: [
      { fields: ["id"] }, 
      { fields: ["userId"] },
      { fields: ["userId", "createdAt"] },
      { fields: ["intent"] },
      { fields: ["userId", "intent"] },
      { fields: ["error"] }
    ],
  }
);

export default Message;

