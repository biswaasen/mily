import { Sequelize, type SyncOptions } from "sequelize";
import { createLogger } from "../utils/logger.js";

const log = createLogger('Database');

if (!process.env.DATABASE_URL) {
  throw new Error("database url is missing.");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  ssl: true,
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 30000,
    evict: 60000,
  },
  dialectOptions: {
    connectTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  retry: {
    max: 3,
    timeout: 30000,
  },
});

export async function safeSync(options?: Omit<SyncOptions, 'force'>) {
  if (options && 'force' in options && options.force === true) {
    throw new Error("CRITICAL: force: true is blocked to prevent accidental data deletion. Use alter: true instead.");
  }
  return await sequelize.sync({ ...options, force: false });
}

export async function ensureConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    log.warn({ err: error }, 'Connection lost, reconnecting...');
    try {
      await sequelize.close();
      await sequelize.authenticate();
      log.info('Reconnected successfully');
      return true;
    } catch (retryError) {
      log.error({ err: retryError }, 'Reconnection failed');
      return false;
    }
  }
}

export default sequelize;
