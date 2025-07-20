import { nextApiHandlers } from "@/dbs/nextApi/main";

import { handlers } from "./handlers";

import { mongoNativeDb } from "../main/db/main";
import { dbTemplates } from "@/dbs/templates/main/main";

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
const bulkResponse = apiConstants.response.bulk;
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
const initializeCollections = async (payload = {}) => {
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
  find: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {} } = api.all;
    const { region, env } = apiParams;

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const results = listDbs.databases ?? [];

    const response = responseSuccess({ data: results });
    return response;
  },
  findByName: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {} } = api.all;
    const { region, env, id: name } = apiParams;

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const results = listDbs.databases.filter((db) => db.name === name);

    const response = responseSuccess({ data: results });
    return response;
  },
  create: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, body } = api.all;
    const { name } = body;
    const { region, env } = apiParams;

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const match = listDbs.databases.find((db) => db.name === name);

    if (match) {
      throw new Error(`${names.group} already exist: "${name}"`);
    }

    const targetDb = await client.db(name);
    await targetDb
      .collection(collectionNames.init)
      .insertOne({ createdAt: new Date() });

    const targetListDbs = await client.db().admin().listDatabases();
    const targetList = targetListDbs.databases.filter((db) => db.name === name);

    if (targetList.length <= 0) {
      throw new Error(
        `Cannot find created ${names.group.toLowerCase()}: "${name}"`
      );
    }
    const results = targetList;

    // initialize collections
    await initializeCollections({ client: targetDb });

    const response = responseSuccess({ data: results });
    return response;
  },
  update: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, body } = api.all;
    const { region, env, id: source } = apiParams;
    const { name: target } = body;

    if (!source || !target) {
      throw new Error(
        `Both source and target ${names.group.toLowerCase()} names are required`
      );
    }

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const sourceDB = client.db(source);
    const sourceDBCollections = await sourceDB.listCollections().toArray();

    if (!sourceDB) {
      throw new Error(`Source ${names.group.toLowerCase()} not found`);
    }

    const targetDb = client.db(target);
    await targetDb
      .collection(collectionNames.init)
      .insertOne({ createdAt: new Date() });

    const targetListDbs = await client.db().admin().listDatabases();
    const targetList = targetListDbs.databases.filter(
      (db) => db.name === target
    );

    if (targetList.length <= 0) {
      throw new Error(`Target ${names.group} not found`);
    }

    for (const col of sourceDBCollections) {
      await targetDb.createCollection(col.name);
      const data = await sourceDB.collection(col.name).find().toArray();

      if (data.length) {
        await targetDb.collection(col.name).insertMany(data);
      }
    }

    const targetDBCollections = await targetDb.listCollections().toArray();
    if (targetDBCollections.length === 0) {
      throw new Error(`No collections found in the target ${names.group}`);
    }

    const sourceNames = sourceDBCollections.map((col) => col.name);
    const targetNames = targetDBCollections.map((col) => col.name);

    const isSameCount = sourceNames.length === targetNames.length;
    const isSameName = sourceNames.every((name) => targetNames.includes(name));

    if (!isSameCount || !isSameName) {
      const failedCollections = sourceNames.filter(
        (name) => !targetNames.includes(name)
      );

      // throw new Error("Incomplete collections");
      const message =
        "Incomplete transfer of collections: " + failedCollections.join(", ");
      throw new Error(message);
    }

    await sourceDB.dropDatabase();
    const results = targetList;

    const response = responseSuccess({ data: results });
    return response;
  },
  delete: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {} } = api.all;
    const { region, env, id: name } = apiParams;

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }
    await client.db(name).dropDatabase();

    const ListDbs = await client.db().admin().listDatabases();
    const match = ListDbs.databases.find((db) => db.name === name);

    if (match) {
      throw new Error(`${names.group} not deleted`);
    }

    const results = [{ name }];

    const response = responseSuccess({ data: results });
    return response;
  },

  // bulk
  findMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, bulk: list = [] } = api.all;
    const { region, env } = apiParams;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length <= 0) {
      throw new Error("List is empty");
    }

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const dbs = listDbs.databases ?? [];

    if (dbs.length <= 0) {
      throw new Error(`No ${names.group.toLowerCase()} found`);
    }

    const dbNames = dbs.map((db) => db.name);
    data = list.filter((db) => dbNames.includes(db.name));
    if (data.length <= 0) {
      rejects.failed = list.filter((db) => !dbNames.includes(db.name));
    }

    const response = responseSuccess({ data, rejects });
    return response;
  },
  createMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, bulk: list = [] } = api.all;
    const { region, env } = apiParams;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length <= 0) {
      throw new Error("List is empty");
    }

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const createDb = async (name) => {
      const listDbs = await client.db().admin().listDatabases();
      const match = listDbs.databases.find((db) => db.name === name);

      if (match) {
        rejects.duplicates.push({
          name,
          error: `${names.group} already exists`,
        });
        return;
      }

      const targetDb = client.db(name);
      await targetDb
        .collection(collectionNames.init)
        .insertOne({ createdAt: new Date() });

      const targetListDbs = await client.db().admin().listDatabases();
      const targetMatch = targetListDbs.databases.find(
        (db) => db.name === name
      );

      if (!targetMatch) {
        rejects.failed.push({ name: item.name, error: error.message });
      }

      // initialize collections
      await initializeCollections({ client: targetDb });
    };

    for (const item of list) {
      try {
        if (!item.name) {
          throw new Error(`${names.group} name is required`);
        }

        await createDb(item.name);
        data.push({ name: item.name });
      } catch (error) {
        rejects.failed.push({ name: item.name, error: error.message });
      }
    }

    const response = responseSuccess({ data, rejects });
    return response;
  },
  updateMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, bulk: list = [] } = api.all;
    const { region, env } = apiParams;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length <= 0) {
      throw new Error("List is empty");
    }

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const setCollections = async (dbs) => {
      const { sourceDB, targetDb, names } = dbs;

      const sourceDBCollections = await sourceDB.listCollections().toArray();
      if (sourceDBCollections.length === 0) {
        data.push({
          ...names,
          message: "No collections to transfer",
        });
        return;
      }

      for (const col of sourceDBCollections) {
        const data = await sourceDB.collection(col.name).find().toArray();
        if (data.length) {
          await targetDb.collection(col.name).insertMany(data);
        }
      }

      const targetDBCollections = await targetDb.listCollections().toArray();
      if (targetDBCollections.length === 0) {
        const notFoundCollections = sourceDBCollections.map((col) => col.name);

        rejects.incomplete.push({
          ...names,
          collections: notFoundCollections,
          error: `No collections found in the new ${names.group}`,
        });
      }

      const sourceNames = sourceDBCollections.map((col) => col.name);
      const targetNames = targetDBCollections.map((col) => col.name);

      const isSameCount = sourceNames.length === targetNames.length;
      const isSameName = sourceNames.every((name) =>
        targetNames.includes(name)
      );

      if (!isSameCount || !isSameName) {
        const failedCollections = sourceNames.filter(
          (name) => !targetNames.includes(name)
        );

        rejects.incomplete.push({
          ...names,
          collections: failedCollections,
          error:
            "Incomplete transfer of collections: " +
            failedCollections.join(", "),
        });
        return;
      }

      data.push({ ...names, message: `${names.group} Updated` });
    };
    const setDbs = async (names) => {
      try {
        const { source, target } = names;

        if (!source || !target) {
          rejects.failed.push({
            ...names,
            error: `Both source and target ${names.group} names are required`,
          });
          return;
        }

        const sourceDB = client.db(source);
        if (!sourceDB) {
          rejects.notFound.push({
            ...names,
            error: `Source ${names.group} not found`,
          });
          return;
        }

        const targetDb = client.db(target);
        await targetDb
          .collection(collectionNames.init)
          .insertOne({ createdAt: new Date() });

        const listDbs = await client.db().admin().listDatabases();
        const match = listDbs.databases.find((db) => db.name === name);

        if (!match) {
          rejects.failed.push({
            ...names,
            error: `Target ${names.group} not found`,
          });
          return;
        }

        await setCollections({ sourceDB, targetDb, names });
      } catch (error) {
        rejects.failed.push({ name: target, error: error.message });
      }
    };

    for (const item of list) {
      await setDbs(item);
    }

    if (success.length > 0) {
      const successNames = success.map((item) => item.source);

      for (const name of successNames) {
        const sourceDB = client.db(name);
        await sourceDB.dropDatabase();
      }
    }

    const response = responseSuccess({ data, rejects });
    return response;
  },
  deleteMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, bulk: list = [] } = api.all;
    const { region, env } = apiParams;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const getDb = async (name) => {
      const listDbs = await client.db().admin().listDatabases();
      const dbs = listDbs.databases ?? [];
      const match = dbs.map((db) => db.name === name);

      return { listDbs, dbs, match };
    };
    const dropDbs = async (name) => {
      try {
        if (!name) {
          rejects.failed.push({
            name,
            error: `${names.group} name is required`,
          });
          return;
        }

        const { match } = await getDb(name);
        if (!match) {
          rejects.notFound.push({ name, error: `${names.group} not found` });
          return;
        }

        await client.db(name).dropDatabase();
        const deletedDb = await getDb();

        if (deletedDb) {
          rejects.failed.push({ name, error: `${names.group} not deleted` });
        }

        data.push({ name });
      } catch (error) {
        rejects.failed.push({ name, error: error.message });
      }
    };

    for (const item of list) {
      await dropDbs(item.name);
    }

    const response = responseSuccess({ data, rejects });
    return response;
  },

  // search
  search: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api } = payload;
    const { params: apiParams = {}, bulk: list = [] } = api.all;
    const { region, env } = apiParams;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length <= 0) {
      throw new Error("List is empty");
    }

    const client = await clientDb.getClient({ region, env });
    if (!client) {
      throw new Error("Invalid client connection");
    }

    const listDbs = await client.db().admin().listDatabases();
    const dbs = listDbs.databases ?? [];

    if (dbs.length <= 0) {
      throw new Error(`No ${names.group.toLowerCase()} found`);
    }

    const dbNames = dbs.map((db) => db.name);
    data = list.filter((db) => dbNames.includes(db.name));
    if (data.length <= 0) {
      rejects.failed = list.filter((db) => !dbNames.includes(db.name));
    }

    const response = responseSuccess({ data, rejects });
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
    find: { messages: ["find"] },
    findByName: { messages: ["find(Name)"] },
    create: { messages: ["create"] },
    update: { messages: ["update"] },
    delete: { messages: ["delete"] },
    findMany: { messages: ["find"], bulk: true },
    createMany: { messages: ["create"], bulk: true },
    updateMany: { messages: ["update"], bulk: true },
    deleteMany: { messages: ["delete"], bulk: true },
    search: { messages: ["search"], bulk: true },
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
const databases = generateMethods(...payloadMethods);
export { databases };
