import dotenv from "dotenv";

//
dotenv.config();
const processEnv = process.env;

// db
const db = {
  enable: {
    router: processEnv.ENABLE_ROUTER ?? false,
    env: processEnv.ENABLE_ENV ?? false,
  },
  names: {
    admin: processEnv.DBNAME_ADMIN ?? "master",
    test: processEnv.DBNAME_TEST ?? "test",
  },
};

// URIs
const uriLocal = {
  client: processEnv.MONGODB_URI_CLIENT,
  db: processEnv.MONGODB_URI,
};
const uriAsia = {
  development: processEnv.MONGODB_URI_CLIENT_ASIA_DEV,
  staging: processEnv.MONGODB_URI_CLIENT_ASIA_STAGING,
  production: processEnv.MONGODB_URI_CLIENT_ASIA_PROD,
};
const uriEurope = {
  development: processEnv.MONGODB_URI_CLIENT_EUROPE_DEV,
  staging: processEnv.MONGODB_URI_CLIENT_EUROPE_STAGING,
  production: processEnv.MONGODB_URI_CLIENT_EUROPE_PROD,
};
const uri = {
  local: uriLocal,
  asia: uriAsia,
  europe: uriEurope,
};

//
const env = {
  uri,
  db,
};

// constants
const routers = {
  express: "express",
  fastify: "fastify",
};
const clients = {
  local: "local",
  mongoose: "mongoose",
  mongodb: "mongodb",
};
const versions = {
  v1: "v1",
  v2: "v2",
};
const envs = {
  development: "development",
  staging: "staging",
  production: "production",
};
const regions = {
  asia: "asia",
  europe: "europe",
};
const constants = {
  routers,
  clients,
  versions,
  regions,
  envs,
};

// defaults
const defaultUri = {
  default: uri.asia.development,
};
const defaultRouters = {
  default: routers.express,
};
const defaultClients = {
  default: clients.mongoose,
  // db: client.mongoose,
};
const defaultVersions = {
  default: versions.v1,
  // db: versions.v1,
};
const defaultEnvs = {
  default: envs.development,
};
const defaultRegions = {
  default: regions.asia,
};
const defaults = {
  uri: defaultUri,
  routers: defaultRouters,
  clients: defaultClients,
  versions: defaultVersions,
  envs: defaultEnvs,
  regions: defaultRegions,
};

// configs
const configDb = {
  router: defaults.routers.default,
  client: defaults.clients.default,
  version: defaults.versions.default,
  //
  enable: {
    env: db.enable.env ? db.enable.env === "true" : false,
  },
  names: db.names,
  uri: defaults.uri.default,
  env: defaults.envs.default,
  region: defaults.regions.default,
};
const configs = {
  db: configDb,
};

export const entryConfigs = {
  constants: constants,
  defaults,
  env,
  configs,
};
