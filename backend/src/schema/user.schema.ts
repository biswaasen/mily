import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

class User extends Model {
  declare id: string;
  declare name: string;
  declare picture: string | null;
  declare email: string;
  declare status: Status;
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(Status)),
      defaultValue: Status.ACTIVE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: true,
    indexes: [{ fields: ["id"] }, { fields: ["email"] }],
  }
);

export default User;
