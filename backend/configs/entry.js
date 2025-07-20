import { entryConfigs } from "./config.js";
import { routerHandlers } from "../routers/main/main.js";
import { databases } from "../databases/main/main.js";

//
const { configs } = entryConfigs;
const dbMaster = configs.db.names.admin;
const dbTest = configs.db.names.test;

//
const routers = routerHandlers;
const clients = databases.clients;

// routers
const getRouters = (payload = {}) => {
  // const {} = payload

  const map = {
    express: routers.express.startServer,
    fastify: routers.fastify.startServer,
  };

  return map;
};

// databases
const getDatabases = (payload = {}) => {
  const getDbHandler = () => {
    const clientHandler = clients[configs.db.client];
    if (!clientHandler) throw new Error("Missing client handler");

    const versionHandler = clientHandler.versions[configs.db.version];
    if (!versionHandler) throw new Error("Missing client version handler");

    const connect = versionHandler?.db?.multiple?.connect;
    const setup = versionHandler?.db?.setup;

    const handlers = {
      connect,
      setup,
    };
    return handlers;
  };
  const dbConnect = async () => {
    try {
      const { connect } = getDbHandler();
      if (!connect) throw new Error("Missing database handler");

      await connect({ db: dbMaster });
      return true;
    } catch (error) {
      console.log("Failed to connect database: ", error.message);
      return false;
    }
  };
  const dbSetup = async () => {
    try {
      const { setup } = getDbHandler();
      if (!setup) throw new Error("Missing database handler");

      await setup.app({ name: dbMaster, bypass: true });
      await setup.app({ name: dbTest, bypass: true });

      return true;
    } catch (error) {
      console.log("Failed to setup database: ", error.message);
      return false;
    }
  };
  const getDomains = () => {
    try {
      const { setup } = getDbHandler();
      if (!setup) throw new Error("Missing database handler");

      const domains = setup.getDomains({});
      return domains;
    } catch (error) {
      return [];
    }
  };

  const map = {
    setup: dbSetup,
    connect: dbConnect,
    getDomains,
  };

  return map;
};

export const entries = { getDatabases, getRouters };
