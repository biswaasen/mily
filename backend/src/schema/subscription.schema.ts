import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export enum PlanType {
  FREE = "free",
  PRO = "pro",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

class Subscription extends Model {
  declare id: string;
  declare userId: string;
  declare plan: PlanType;
  declare status: SubscriptionStatus;
  declare limit: number;
  declare used: number;
  declare expiresAt: Date | null;
  declare razorpayCustomerId: string | null;
  declare razorpaySubscriptionId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Subscription.init(
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
    plan: {
      type: DataTypes.ENUM(...Object.values(PlanType)),
      defaultValue: PlanType.FREE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      defaultValue: SubscriptionStatus.ACTIVE,
      allowNull: false,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    razorpayCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpaySubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Subscription",
    timestamps: true,
    indexes: [{ fields: ["id"] }, { fields: ["userId"] }],
  }
);

export default Subscription;

