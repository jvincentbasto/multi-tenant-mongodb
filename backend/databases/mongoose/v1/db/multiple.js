import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { entryConfigs } from "../../../../configs/config.js";

dotenv.config();

const { env: configEnv, configs } = entryConfigs;
const config = configs.db;

if (!config.uri) {
  throw new Error("Database URI not found.");
}

// Setup global cache
if (!global._mongoCache) {
  global._mongoCache = {
    mongoClients: new Map(),
    mongooseConnections: new Map(),
  };
}
const mongoCache = global._mongoCache;

const getMongoCache = (payload = {}) => {
  return mongoCache;
};

// get uri
const getMongoUri = (payload = {}) => {
  const { region = config.region, env = config.env } = payload;

  const curEnv = config.enable.env ? env : config.env;

  const uris = configEnv.uri;
  const uri = uris?.[region]?.[curEnv];
  return uri;
};

// get client
const getMongooseClient = async (payload = {}) => {
  const uri = getMongoUri(payload);
  if (!uri) throw new Error("Invalid URI");

  if (mongoCache.mongoClients.has(uri)) {
    return mongoCache.mongoClients.get(uri);
  }

  const client = new MongoClient(uri);
  const connected = await client.connect();
  client._uri = uri;
  mongoCache.mongoClients.set(uri, connected);

  return connected;
};

// verify db
const verifyDB = async (uri, name) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();

    const exists = databases.some((db) => db.name === name);
    return exists;
  } catch (error) {
    throw new Error("Database verification error. " + (error?.message ?? ""));
  } finally {
    await client.close(); // Very important
  }
};

const connectMongoose = async (payload = {}) => {
  try {
    const { region = config.region, env = config.env, db } = payload;

    const uri = getMongoUri({ region, env });
    if (!uri) {
      throw new Error(`Invalid URI`);
    }

    const verified = await verifyDB(uri, db);
    if (!verified) {
      throw new Error(`Database '${db}' does not exist.`);
    }

    const key = `${uri}_${db}`;
    if (mongoCache.mongooseConnections.has(key)) {
      return mongoCache.mongooseConnections.get(key);
    }

    const uriParams = "?retryWrites=true&w=majority";
    const connection = await mongoose
      .createConnection(`${uri}/${db}${uriParams}`, {
        bufferCommands: false,
      })
      .asPromise();

    if (connection.readyState !== 1) {
      throw new Error("Failed to create connection.");
    }

    // custom properties
    connection.custom = { indices: new Set() };
    mongoCache.mongooseConnections.set(key, connection);

    return connection;
  } catch (error) {
    throw new Error("Mongoose connection error. " + (error?.message ?? ""));
  }
};

export const multiple = {
  getCache: getMongoCache,
  getClient: getMongooseClient,
  connect: connectMongoose,
};
