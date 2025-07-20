import { nextApiHandlers } from "@/dbs/nextApi/main";

import { handlers } from "./handlers";

import { mongoNativeDb } from "../main/db/main";
import { dbTemplates } from "@/dbs/templates/main/main";
import { entryConfigs } from "@/dbs/configs/config";

//
const { env: configEnv } = entryConfigs;
const dbMaster = configEnv.db.names.admin;

//
const names = {
  type: "Method",
  group: "Database",
};
const collectionNames = {
  init: "_init",
};
const messageList = [names.type, names.group];

const { response } = await nextApiHandlers.getMainVersion();
const { response: apiResponse } = response.default;
const { handlers: apiHandlers, constants: apiConstants } = apiResponse;

//
const responseSuccess = apiHandlers.success;
// const responseReject = apiHandlers.reject;

// handlers
const generateMethods = handlers.method;
const formatData = handlers.formatData;
const getParams = handlers.getParams;

//
const clientDb = mongoNativeDb.multiple;
const { schemas: schemaTemplates } = dbTemplates.getVersion("v1");
const { groups: groupTemplates } = schemaTemplates;

// initialize collections
const initializeCollections = async (...args) => {
  const [payload, params, options] = getParams(args);
  const { client } = payload;

  const templates = groupTemplates.app;
  const templateValues = Object.values(templates);

  // create collections
  for (const template of templateValues) {
    const { collection: name } = template.names;

    await client.createCollection(name);
  }

  // names
  const schemaName = templates.schema.names.collection;
  const names = templateValues.map((template) => template.names.collection);

  // verify collections
  const listDbs = await client.listCollections().toArray();
  const hasSchema = listDbs.some((db) => db.name === schemaName);
  const hasCollection = listDbs.filter((db) => names.includes(db.name));
  const collectionNames = hasCollection.map((db) => db.name);

  //
  const validCollections = templateValues.filter((template) => {
    const { collection: name } = template.names;
    const match = collectionNames.some((value) => value === name);

    return match;
  });

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
      await client.collection(schemaName).insertOne(payload);

      // set records
      for (const item of data) {
        const collectionName = names.collection;
        await client.collection(collectionName).insertOne(item);
      }
    }
  }
};

// main
const methods = {
  app: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {} } = api.all;
    const { region, env } = apiParams;
    const name = dbMaster;

    const client = await clientDb.getClient({ region, env, db: dbMaster });

    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const match = listDbs.databases.find((db) => db.name === name);

    if (match) {
      throw new Error(`Database already exist: "${name}"`);
    }

    const targetDb = await client.db(name);
    await targetDb.collection("_init").insertOne({ createdAt: new Date() });

    const targetListDbs = await client.db().admin().listDatabases();
    const targetList = targetListDbs.databases.filter((db) => db.name === name);

    if (targetList.length <= 0) {
      throw new Error(`Cannot find created database: "${name}"`);
    }
    const results = targetList;

    // initialize collections
    await initializeCollections({ client: targetDb });

    const response = responseSuccess({
      message: "Successfully initialized database",
    });
    return response;
  },
};

// map resource
const mapResource = () => {
  const construct = (messages = [], name, bulk = false) => {
    const currentMessage = [...messageList, ...messages];
    const fn = methods[name];

    const values = { main: true, messages: currentMessage, fn, bulk };
    return values;
  };
  const map = {
    app: { messages: ["setup"] },
  };

  const mapped = {};
  for (const [key, value] of Object.entries(map)) {
    const { messages, bulk } = value;
    mapped[key] = construct(messages, key, bulk);
  }

  return mapped;
};

// methods
const mapped = mapResource();
const payloadMethods = [{ map: mapped }];
export const setup = generateMethods(...payloadMethods);
