import { entryConfigs } from "../../../../configs/config.js";
import { templates } from "../../../templates/main/main.js";
import { multiple } from "./multiple.js";

//
const { env: configEnv } = entryConfigs;
const dbMaster = configEnv.db.names.admin;

// db
const dbHandler = multiple;

const { v1: templateHandlers } = templates.versions;
const { groups: templateGroups } = templateHandlers.schemas;

// initialize collections
const setupCollections = async (payload = {}) => {
  const { client, conn, name: dbName } = payload;
  const isDbAdmin = dbName === dbMaster;

  const templates = templateGroups.all;
  const templateValues = Object.values(templates);

  // create collections
  for (const template of templateValues) {
    const { adminOnly } = template?.options ?? {};
    const { collection: name } = template.names;

    if (adminOnly) {
      if (isDbAdmin) {
        await conn.createCollection(name);
      }
      continue;
    }

    await conn.createCollection(name);
  }

  // names
  const schemaName = templates.schema.names.collection;
  const names = templateValues.map((template) => template.names.collection);

  // verify collections
  const listDbs = await conn.listCollections().toArray();
  const hasSchema = listDbs.some((db) => db.name === schemaName);
  const hasCollection = listDbs.filter((db) => names.includes(db.name));
  const collectionNames = hasCollection.map((db) => db.name);

  //
  const validCollections = templateValues.filter((template) => {
    const { collection: name } = template.names;
    const match = collectionNames.some((value) => value === name);

    return match;
  });

  //
  if (hasSchema) {
    for (const template of validCollections) {
      const { names, map, indices = [], data = [] } = template;

      const jsonDefinition = JSON.stringify(map);
      const jsonIndices = JSON.stringify(indices);

      // set schema definitions on collection "schemas"
      const payload = {
        name: names.collection,
        definition: jsonDefinition,
        indices: jsonIndices,
      };
      await conn.collection(schemaName).insertOne(payload);

      // set records
      for (const item of data) {
        const collectionName = names.collection;
        await conn.collection(collectionName).insertOne(item);
      }
    }
  }
};

// store domains per client
const storeDomains = async (payload = {}) => {
  const { name: dbName } = payload;
  const appsCollection = templateHandlers.schemas.app.apps;
  const { names } = appsCollection;

  const isDbAdmin = dbName === dbMaster;
  if (!isDbAdmin) return;

  const mongoCache = dbHandler.getCache();
  const { mongoClients } = mongoCache;

  for (const [key, client] of mongoClients) {
    // console.log("key", key);

    const listDbs = await client.db().admin().listDatabases();
    const matchDb = listDbs.databases.find((db) => db.name === dbName);
    if (!matchDb) continue;
    // console.log("matchDb", !!matchDb);

    const conn = await client.db(dbName);
    const collections = await conn.listCollections().toArray();
    const matchCollection = collections.filter(
      (col) => col.name === names.collection
    );
    if (!matchCollection) continue;
    // console.log("matchCollection", !!matchCollection);

    // domains
    const results = await conn.collection(names.collection).find({}).toArray();
    const domainLists = results.map((m) => {
      let domains;
      try {
        domains = JSON.parse(m?.domains);
      } catch {
        domains = [];
      }

      return domains;
    });
    const domains = [...new Set(domainLists.flat())];

    // set domains per client
    client.custom = { ...client.custom, domains };
    // console.log("client.custom", client.custom);
  }
};
const getDomains = (payload = {}) => {
  // const {} = payload;

  const mongoCache = dbHandler.getCache();
  const { mongoClients } = mongoCache;

  const domainLists = [];
  for (const [key, value] of mongoClients) {
    const { domains = [] } = value?.custom ?? {};
    domainLists.push(...domains);
  }

  return domainLists;
};

// main
const setupApp = async (payload = {}) => {
  try {
    const { name = dbMaster, bypass = false, env, region } = payload;
    const client = await dbHandler.getClient({ env, region });

    const listDbs = await client.db().admin().listDatabases();
    const match = listDbs.databases.find((db) => db.name === name);

    const targetDb = await client.db(name);
    if (match) {
      if (bypass) {
        // store domains
        await storeDomains({ name });

        console.log("Database already initialized");
        return;
      } else {
        throw new Error(`Database already exist`);
      }
    }

    await targetDb.collection("_init").insertOne({ createdAt: new Date() });

    const targetListDbs = await client.db().admin().listDatabases();
    const targetList = targetListDbs.databases.filter((db) => db.name === name);
    if (targetList.length <= 0) {
      throw new Error(`Failed to create database`);
    }

    // initialize collections
    await setupCollections({ client, conn: targetDb, name });

    // store domains
    await storeDomains({ name });

    const message = "Successfully initialized database";
    console.log(message);

    const response = { message };
    return response;
  } catch (error) {
    throw new Error(`Failed to initialized database: ${error.message}`);
  }
};

export const setupDb = {
  app: setupApp,
  collection: setupCollections,
  storeDomains,
  getDomains,
};
