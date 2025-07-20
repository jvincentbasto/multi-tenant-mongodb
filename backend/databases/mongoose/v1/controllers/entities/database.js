import { handlers } from "../handlers.js";
import { apps as methodApps } from "../apps.js";
import { setupDb } from "../../db/setup.js";

// context
const { responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: { dynamic: true } },
  params: {
    enable: { client: true, conn: false, model: false },
    bulk: { model: true },
  },
};

//
const collectionNames = {
  apps: "apps",
  init: "_init",
};

// initialize collections
const setupCollections = setupDb.collection;

// resources
const resource1 = methodApps;

// handlers
const matchResponse = (payload = {}, params = {}, options = {}) => {
  const { payload1 = {}, payload2 = {} } = payload;
  const { data: data1 = [], field: field1 = "" } = payload1;
  const { data: data2 = [], field: field2 = "" } = payload2;

  const matchData = data1.filter((item) => {
    const match = data2.some((s) => s[field2] === item[field1]);
    return match;
  });
  const data = matchData.map((item) => {
    const match = data2.find((s) => s[field2] === item[field1]);
    const obj = { ...item, ...match };

    return obj;
  });

  return data;
};

// main
const find = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { client, conn, Models } = ctx;
    const [Model] = Models;

    let results1 = await client.db().admin().listDatabases();
    let formatted1 = results1.databases ?? [];

    let results2 = await Model.find({}).lean();
    let formatted2 = results2.map((item) => formatData(item));

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const findByName = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, client, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    let results1 = await client.db().admin().listDatabases();
    let formatted1 = results1.databases.filter((db) => db.name === name);

    let results2 = await Model.find({ name }).lean();
    let formatted2 = results2.map((item) => formatData(item)) ?? [];

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const findById = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, client, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    let results1 = await client.db().admin().listDatabases();
    let formatted1 = results1.databases.filter((db) => db.name === name);

    let results2 = await Model.find({ name }).lean();
    let formatted2 = results2.map((item) => formatData(item)) ?? [];

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const create = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, client, Models } = ctx;
    const { name } = body;
    const [Model] = Models;

    const listDbs = await client.db().admin().listDatabases();
    const match = listDbs.databases.find((db) => db.name === name);
    if (match) {
      throw new Error(`Database already exist`);
    }

    const targetDb = await client.db(name);
    await targetDb
      .collection(collectionNames.init)
      .insertOne({ createdAt: new Date() });

    const targetListDbs = await client.db().admin().listDatabases();
    const targetList = targetListDbs.databases.filter((db) => db.name === name);

    if (targetList.length <= 0) {
      throw new Error(`Failed to create database`);
    }

    // initialize collections
    await setupCollections({ client: targetDb });
    let formatted1 = targetList;

    let results2 = await Model.create(body);
    let formatted2 = [formatData(results2)];

    // domains
    const resAll = await Model.find().lean();
    const domainLists = resAll.map((item) => {
      let domains;
      try {
        domains = JSON.parse(item?.domains);
      } catch {
        domains = [];
      }

      return domains;
    });
    const domains = [...new Set(domainLists.flat())];
    const uniqueDomains = [...new Set(domains)];

    client.custom = {
      ...client.custom,
      domains: uniqueDomains,
    };

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const update = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, body, client, Models } = ctx;
    const { id: source } = params;
    const { name: target } = body;
    const [Model] = Models;

    if (!source || !target) {
      throw new Error(`Both source and target database names are required`);
    }

    const sourceDB = client.db(source);
    const sourceDBCollections = await sourceDB.listCollections().toArray();
    if (!sourceDB) {
      throw new Error(`Source database not found`);
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
      throw new Error(`Target database not found`);
    }

    //
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

    //
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
    let formatted1 = targetList;

    const updateOptions = { new: true, runValidators: true };
    let results2 = await Model.findOneAndUpdate(
      { name: source },
      body,
      updateOptions
    );
    let formatted2 = [formatData(results2)];

    // domains
    const resAll = await Model.find().lean();
    const domainLists = resAll.map((item) => {
      let domains;
      try {
        domains = JSON.parse(item?.domains);
      } catch {
        domains = [];
      }

      return domains;
    });
    const domains = [...new Set(domainLists.flat())];
    const uniqueDomains = [...new Set(domains)];

    client.custom = {
      ...client.custom,
      domains: uniqueDomains,
    };

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const drop = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, client, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    await client.db(name).dropDatabase();

    const ListDbs = await client.db().admin().listDatabases();
    const match = ListDbs.databases.find((db) => db.name === name);

    if (match) {
      throw new Error(`Failed to delete database`);
    }
    let formatted1 = [{ name }];

    let results2 = await Model.findOneAndDelete({ name });
    let formatted2 = [{ data: name }];

    // domains
    const resAll = await Model.find().lean();
    const domainLists = resAll.map((item) => {
      let domains;
      try {
        domains = JSON.parse(item?.domains);
      } catch {
        domains = [];
      }

      return domains;
    });
    const domains = [...new Set(domainLists.flat())];
    const uniqueDomains = [...new Set(domains)];

    client.custom = {
      ...client.custom,
      domains: uniqueDomains,
    };

    const resources = {
      collections: formatted1,
      schemas: formatted2,
    };

    const payloadResponse = {
      payload1: { data: formatted1, field: "name" },
      payload2: { data: formatted2, field: "name" },
    };
    const data = matchResponse(payloadResponse);

    const payloadData = { res, data, resources };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// bulk
const findMany = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const createMany = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const updateMany = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const deleteMany = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// search
const search = async (req, res) => {
  try {
    const models = [collectionNames.apps];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const databases = {
  find,
  findById,
  findByName,
  //
  create,
  update,
  delete: drop,
  //
  findMany,
  createMany,
  updateMany,
  deleteMany,
  //
  search,
};
