import { handlers } from "./handlers.js";
import { setupDb } from "../db/setup.js";

// context
const { constBulk, responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: {} },
  params: { enable: { client: true, conn: false, model: false } },
};

// initialize collections
const setupCollections = setupDb.collection;
const collectionNames = {
  init: "_init",
};

// main
const find = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { client } = ctx;

    const listDbs = await client.db().admin().listDatabases();
    const format = listDbs.databases ?? [];

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
    const { client, params } = ctx;
    const { id: name } = params;

    const listDbs = await client.db().admin().listDatabases();
    const format = listDbs.databases.filter((db) => db.name === name);

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
    const { client, body } = ctx;
    const { name } = body;

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
    const results = targetList;

    // initialize collections
    await setupCollections({ client: targetDb });
    const format = targetList;

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
    const { params, body, client } = ctx;

    const { id: source } = params;
    const { name: target } = body;

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
    const format = targetList;

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
    const { params, client } = ctx;
    const { id: name } = params;

    await client.db(name).dropDatabase();

    const ListDbs = await client.db().admin().listDatabases();
    const match = ListDbs.databases.find((db) => db.name === name);

    if (match) {
      throw new Error(`Failed to delete database`);
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
    const { bulk: list, client } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const listDbs = await client.db().admin().listDatabases();
    const dbs = listDbs.databases ?? [];
    if (dbs.length <= 0) {
      throw new Error(`No database found`);
    }

    const dbNames = dbs.map((db) => db.name);
    success = list.filter((db) => dbNames.includes(db.name));
    if (success.length <= 0) {
      rejects.failed = list.filter((db) => !dbNames.includes(db.name));
    }

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
    const { bulk: list, client } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    //
    const createDb = async (name) => {
      const listDbs = await client.db().admin().listDatabases();
      const match = listDbs.databases.find((db) => db.name === name);

      if (match) {
        const payload = { name, error: `Database already exists` };
        rejects.duplicates.push(payload);
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
        const payload = { name: item.name };
        rejects.failed.push(payload);
      }

      // initialize collections
      await setupCollections({ client: targetDb });
    };

    for (const item of list) {
      try {
        if (!item.name) {
          throw new Error(`Database name is required`);
        }

        await createDb(item.name);
        success.push({ name: item.name });
      } catch (error) {
        const payload = { name: item.name, error: error.message };
        rejects.failed.push(payload);
      }
    }

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
    const { bulk: list, client } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const setCollections = async (dbs) => {
      const { sourceDB, targetDb, names } = dbs;

      const sourceDBCollections = await sourceDB.listCollections().toArray();
      if (sourceDBCollections.length === 0) {
        success.push({
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
          error: `No collections found in the target database`,
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

      success.push({ ...names, message: `Database updated` });
    };
    const setDbs = async (names) => {
      try {
        const { source, target } = names;

        if (!source || !target) {
          rejects.failed.push({
            ...names,
            error: `Both source and target database names are required`,
          });
          return;
        }

        const sourceDB = client.db(source);
        if (!sourceDB) {
          rejects.notFound.push({
            ...names,
            error: `Source database not found`,
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
            error: `Target database not found`,
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
    const { bulk: list, client } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

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
            error: `Database name is required`,
          });
          return;
        }

        const { match } = await getDb(name);
        if (!match) {
          rejects.notFound.push({ name, error: `Database not found` });
          return;
        }

        await client.db(name).dropDatabase();
        const deletedDb = await getDb();

        if (deletedDb) {
          rejects.failed.push({ name, error: `Database not deleted` });
        }

        success.push({ name });
      } catch (error) {
        rejects.failed.push({ name, error: error.message });
      }
    };

    for (const item of list) {
      await dropDbs(item.name);
    }

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
    const { bulk: list, client } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    const listDbs = await client.db().admin().listDatabases();
    const dbs = listDbs.databases ?? [];

    if (dbs.length <= 0) {
      throw new Error(`No database found`);
    }

    const dbNames = dbs.map((db) => db.name);
    success = list.filter((db) => dbNames.includes(db.name));
    if (success.length <= 0) {
      rejects.failed = list.filter((db) => !dbNames.includes(db.name));
    }
    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const databases = {
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
