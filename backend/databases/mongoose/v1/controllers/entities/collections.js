import { collections as methodCollections } from "../collections.js";
import { schemas as methodSchemas } from "../schemas.js";
import { handlers } from "../handlers.js";

// context
const { responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: { dynamic: true } },
  params: { enable: {}, bulk: { model: true } },
};

//
const collectionNames = {
  schemas: "schemas",
};

// resources
const resource1 = methodCollections;
const resource2 = methodSchemas;

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { conn, Models } = ctx;
    const [Model] = Models;

    let results1 = await conn.db.listCollections().toArray();
    let formatted1 = results1.map((item) => formatData(item));

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, conn, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    const collections = await conn.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, conn, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    const collections = await conn.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, conn, Models } = ctx;
    const { name } = body;
    const [Model] = Models;

    const collections1 = await conn.db.listCollections().toArray();
    const match = collections1.some((col) => col.name === name);
    if (match) {
      throw new Error(`Collection already exist: "${name}"`);
    }

    await conn.db.createCollection(name);
    const collections2 = await conn.db.listCollections().toArray();
    let results1 = collections2.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));
    if (results1.length <= 0) {
      throw new Error(`Failed to create collection"`);
    }

    let results2 = await Model.create(body);
    let formatted2 = [formatData(results2)];

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, body, conn, Models } = ctx;
    const { id: source } = params;
    const { name: target } = body;
    const [Model] = Models;

    if (!source || !target) {
      throw new Error("Both source and target are required");
    }
    const clientCollections = await conn.db.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === source);
    const targetMatch = clientCollections.some((col) => col.name === target);
    if (!sourceMatch) {
      throw new Error(`Source collection does not exist`);
    }
    if (targetMatch) {
      throw new Error(`Target collection already exist`);
    }

    await conn.db.renameCollection(source, target);
    const collections = await conn.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === target);
    let formatted1 = results1.map((item) => formatData(item));
    if (formatted1.length <= 0) {
      throw new Error(`Failed to update target collection`);
    }

    const updateOptions = { new: true, runValidators: true };
    let results2 = await Model.findOneAndUpdate(
      { name: source },
      body,
      updateOptions
    );
    let formatted2 = [formatData(results2)];

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
    const models = [collectionNames.schemas];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, conn, Models } = ctx;
    const { id: name } = params;
    const [Model] = Models;

    const clientCollections = await conn.db.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === name);
    if (!sourceMatch) {
      throw new Error(`Source collection does not exist`);
    }

    await conn.dropCollection(name);
    const collections = await conn.db.listCollections().toArray();
    const results1 = collections.some((col) => col.name === name);
    if (results1) {
      throw new Error(`Failed to delete collection`);
    }
    let formatted1 = [{ data: name }];

    let results2 = await Model.findOneAndDelete({ name });
    let formatted2 = [{ data: name }];

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
    const models = [collectionNames.schemas];

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
    const models = [collectionNames.schemas];

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
    const models = [collectionNames.schemas];

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
    const models = [collectionNames.schemas];

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
    const models = [collectionNames.schemas];

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

export const collections = {
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
