import { handlers } from "./handlers.js";

// context
const { constBulk, responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: {} },
  params: { enable: { model: false } },
};

// main
const find = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { conn } = ctx;

    const collections = await conn.db.listCollections().toArray();
    const format = collections.map((item) => formatData(item));

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const findByName = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, conn } = ctx;
    const { id: name } = params;

    const collections = await conn.db.listCollections().toArray();
    const results = collections.filter((col) => col.name === name);
    const format = results.map((item) => formatData(item));

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const create = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { body, conn } = ctx;
    const { name } = body;

    const collections = await conn.db.listCollections().toArray();
    const match = collections.some((col) => col.name === name);
    if (match) {
      throw new Error(`Collection already exist`);
    }

    await conn.db.createCollection(name);

    const newCollections = await conn.db.listCollections().toArray();
    const results = newCollections.filter((col) => col.name === name);
    const format = results.map((item) => formatData(item));
    if (results.length <= 0) {
      throw new Error(`Failed to create collection`);
    }

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const update = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, body, conn } = ctx;
    const { id: source } = params;
    const { name: target } = body;

    if (!source || !target) {
      throw new Error("Both source and target are required");
    }

    const clientCollections = await conn.db.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === source);
    const targetMatch = clientCollections.some((col) => col.name === target);

    if (!sourceMatch) {
      throw new Error(`Missing source collection`);
    }
    if (targetMatch) {
      throw new Error(`Target collection already exist:`);
    }

    await conn.db.renameCollection(source, target);

    const collections = await conn.db.listCollections().toArray();
    const results = collections.filter((col) => col.name === target);
    const format = results.map((item) => formatData(item));
    if (results.length <= 0) {
      throw new Error(`Failed to updated collection`);
    }

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const drop = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, conn } = ctx;
    const { id: name } = params;

    const clientCollections = await conn.db.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === name);
    if (!sourceMatch) {
      throw new Error(`Source collection does not exist`);
    }

    await conn.dropCollection(name);

    const collections = await conn.db.listCollections().toArray();
    const match = collections.some((col) => col.name === name);
    if (match) {
      throw new Error(`Failed to delete collection`);
    }
    const format = [{ name }];

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// bulk
const findMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const collections = await conn.db.listCollections().toArray();
    rejects.failed = collections.filter((col) => !list.includes(col.name));

    const results = collections.filter((col) => list.includes(col.name));
    success = results.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const createMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const createCollection = async (name) => {
      const collections = await conn.db.listCollections().toArray();
      const match = collections.some((col) => col.name === name);

      if (match) {
        const payload = { name, message: `Collection already exist` };
        rejects.duplicates.push(payload);
        return;
      }

      await conn.createCollection(name);

      const newCollections = await conn.db.listCollections().toArray();
      const newMatch = newCollections.some((col) => col.name === name);

      if (!newMatch) {
        const payload = { name, message: `Failed to create collection` };
        rejects.failed.push(payload);
        return;
      }

      data.push({ name });
    };

    for (const item of list) {
      await createCollection(item);
    }
    data = results.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const updateMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const updateCollections = async (payload) => {
      const { source, target } = payload;

      if (!source || !target) {
        const payloadItem = {
          ...payload,
          message: "Both source and target are required",
        };
        rejects.failed.push(payloadItem);
        return;
      }

      const clientCollections = await conn.db.listCollections().toArray();
      const sourceMatch = clientCollections.some((col) => col.name === source);
      const targetMatch = clientCollections.some((col) => col.name === target);

      if (!sourceMatch) {
        rejects.notFound.push({
          ...payload,
          message: `Source collection does not exist`,
        });
        return;
      }
      if (targetMatch) {
        const payloadItem = {
          ...payload,
          message: `Target collection already exist:`,
        };
        rejects.duplicates.push(payloadItem);
        return;
      }

      await conn.db.renameCollection(source, target);
      const collections = await conn.db.listCollections().toArray();
      const match = collections.some((col) => col.name === target);

      if (!match) {
        const payloadItem = {
          ...payload,
          message: `Failed to update target collection`,
        };
        rejects.failed.push(payloadItem);
        return;
      }

      data.push({ payload });
    };

    for (const item of list) {
      await updateCollections(item);
    }
    success = success.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const deleteMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const dropCollections = async (name) => {
      const clientCollections = await conn.db.listCollections().toArray();
      const sourceMatch = clientCollections.some((col) => col.name === name);

      if (!sourceMatch) {
        const payload = { name, message: `Source collection does not exist` };
        rejects.notFound.push(payload);
        return;
      }

      await conn.dropCollection(name);

      const collections = await conn.db.listCollections().toArray();
      const match = collections.some((col) => col.name === name);

      if (!match) {
        const payload = { name, message: `Failed to deleted collection` };
        rejects.failed.push(payload);
        return;
      }

      success.push({ name });
    };

    for (const item of list) {
      await dropCollections(item);
    }
    success = success.map((item) => formatData(item));

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
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, conn } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const collections = await conn.db.listCollections().toArray();
    rejects.failed = collections.filter((col) => !list.includes(col.name));
    const results = collections.filter((col) => list.includes(col.name));
    success = results.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const collections = {
  find,
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
