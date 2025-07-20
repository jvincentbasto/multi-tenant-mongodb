import { ObjectId } from "mongodb";

import { nextApiHandlers } from "@/dbs/nextApi/main";
import { methodConfig } from "../main/config";

import { handlers } from "../handlers";

//
const methodOptions = methodConfig.default;
const names = {
  type: "Method",
  group: "Person",
};
const collectionName = "persons";
const messageList = [names.type, names.group];

const { response } = await nextApiHandlers.getMainVersion();
const { response: apiResponse } = response.default;
const { handlers: apiHandlers, constants: apiConstants } = apiResponse;

//
const bulkResponse = apiConstants.response.bulk;
const responseSuccess = apiHandlers.success;
// const responseReject = apiHandlers.reject;

//
// handlers
const generateMethods = handlers.method;
const formatData = handlers.formatData;
const getParams = handlers.getParams;

// main
const methods = {
  find: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const collection = client.collection(collectionName);
    const results = await collection.find({}).toArray();
    const formattedData = results.map((item) => formatData(item));

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  findById: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id } = apiParams;

    const collection = client.collection(collectionName);
    const results = await collection.find({ _id: new ObjectId(id) }).toArray();
    const formattedData = results.map((item) => formatData(item));

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  create: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const {  } = params;

    const { body } = api.all;

    const collection = client.collection(collectionName);
    const results = await collection.insertOne(body);
    const formattedData = [formatData(results)];

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  update: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const {  } = params;

    const { params: apiParams } = api.all;
    const { id } = apiParams;

    const collection = client.collection(collectionName);

    const query = { _id: new ObjectId(id) };
    const results = await collection.updateOne(query, { $set: body });
    const formattedData = [formatData(results)];

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  delete: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const { } = params;

    const { params: apiParams } = api.all;
    const { id } = apiParams;

    const collection = client.collection(collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    const formattedData = [{ data: id }];

    const response = responseSuccess({ data: formattedData });
    return response;
  },

  // bulk
  findMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const {  } = params;
    const {
      enableToObject = methodOptions.enableToObject,
      controlled = methodOptions.controlled,
      method = methodOptions.method,
    } = options;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    const collection = client.collection(collectionName);

    const methodSingle = async () => {
      for (const item of list) {
        try {
          const results = await collection.insertOne(body);
          data.push(results);
        } catch (err) {
          rejects.failed.push({
            item,
            error: err?.message || `${names.group} not created`,
          });
        }
      }
    };

    const methodBulk = async () => {
      try {
        const resultBulk = await collection.insertMany(list, {
          ordered: false,
        });
        const resultIds = resultBulk.map((doc) => doc._id.toString());

        // Fetch created documents
        const createdDocs = await collection.find({
          _id: { $in: resultIds },
        });
        const insertedIds = new Set(
          createdDocs.map((doc) => doc._id.toString())
        );

        createdDocs.forEach((doc) => {
          const result = enableToObject ? doc.toObject() : doc;
          data.push(result);
        });

        list.forEach((item) => {
          if (!insertedIds.has(item._id?.toString())) {
            rejects.failed.push({
              item,
              error: `${names.group} not created`,
            });
          }
        });
      } catch (err) {
        rejects.failed.push({ error: err?.message || "Bulk insert failed" });
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    data = data.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  createMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const { } = params;
    const {
      enableToObject = methodOptions.enableToObject,
      controlled = methodOptions.controlled,
      method = methodOptions.method,
    } = options;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    const Model = await getModel({ name: collectionName, client });
    if (!Model) {
      throw new Error("Model is required");
    }
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("List is required");
    }

    const methodSingle = async () => {
      for (const item of list) {
        try {
          let doc;
          if (controlled) {
            const newInstance = new Model(item);
            doc = await newInstance.save();
          } else {
            doc = await Model.create(item);
          }

          const result = enableToObject ? doc.toObject() : doc;
          data.push(result);
        } catch (err) {
          rejects.failed.push({
            item,
            error: err?.message || `${names.group} not created`,
          });
        }
      }
    };

    const methodBulk = async () => {
      try {
        const resultBulk = await Model.insertMany(list, { ordered: false });
        const resultIds = resultBulk.map((doc) => doc._id.toString());

        // Fetch created documents
        const createdDocs = await Model.find({ _id: { $in: resultIds } });
        const insertedIds = new Set(
          createdDocs.map((doc) => doc._id.toString())
        );

        createdDocs.forEach((doc) => {
          const result = enableToObject ? doc.toObject() : doc;
          data.push(result);
        });

        list.forEach((item) => {
          if (!insertedIds.has(item._id?.toString())) {
            rejects.failed.push({
              item,
              error: `${names.group} not created`,
            });
          }
        });
      } catch (err) {
        rejects.failed.push({ error: err?.message || "Bulk insert failed" });
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    data = data.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  updateMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    const {
      enableToObject = methodOptions.enableToObject,
      controlled = methodOptions.controlled,
      method = methodOptions.method,
    } = options;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    const collection = client.collection(collectionName);

    const methodSingle = async () => {
      for (const { id, ...item } of list) {
        try {
          if (!id) throw new Error("Missing ID");

          const query = { _id: new ObjectId(id) };
          const results = await collection.updateOne(query, { $set: body });

          data.push(results);
        } catch (err) {
          rejects.failed.push({
            id,
            list: item,
            error: err?.message || `${names.group} not found or not updated`,
          });
        }
      }
    };

    const methodBulk = async () => {
      const ids = list.map(({ id }) => id).filter(Boolean);

      // Add items with null ids to the failed array
      list.forEach((item) => {
        if (!item.id) {
          rejects.failed.push({ id: null, item, error: "Missing ID" });
        }
      });

      try {
        const existingDocs = await collection.find({ _id: { $in: ids } });
        const existingIds = new Set(
          existingDocs.map((doc) => doc._id.toString())
        );

        const bulkOps = list
          .filter(({ id }) => existingIds.has(id))
          .map(({ id, ...item }) => ({
            updateOne: {
              filter: { _id: id },
              update: { $set: item },
            },
          }));
        // console.log("bulkOps", bulkOps);

        // bulk write | return object
        const resultBulk = await collection.bulkWrite(bulkOps);
        // console.log("resultBulk", resultBulk);

        // Fetch updated schemas
        const updatedDocs = await collection
          .find({ _id: { $in: ids } })
          .toArray();
        const updatedIds = new Set(
          updatedDocs.map((doc) => doc._id.toString())
        );

        updatedDocs.forEach((doc) => {
          const result = enableToObject ? doc.toObject() : doc;
          success.push(result);
        });

        // failed data
        list.forEach((item) => {
          const { id } = item;

          if (!updatedIds.has(id)) {
            rejects.failed.push({
              id,
              item,
              error: `${names.group} not found or not updated`,
            });
          }
        });
      } catch (error) {
        rejects.failed.push({ error: error.message || "Bulk update failed" });
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    data = data.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  deleteMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    // const {  } = params;
    const {
      controlled = methodOptions.controlled,
      method = methodOptions.method,
    } = options;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    const collection = client.collection(collectionName);

    const methodSingle = async () => {
      for (const id of list) {
        try {
          let doc = await collection.findById(id);
          if (!doc) throw new Error("Document not found");

          const result = await collection.deleteOne({
            _id: new ObjectId(id),
          });

          data.push(id);
        } catch (err) {
          rejects.failed.push({
            id,
            error: err?.message || `${names.group} not deleted`,
          });
        }
      }
    };

    const methodBulk = async () => {
      // 🔍 existing docs
      const existingDocs = await collection
        .find({ _id: { $in: list } })
        .toArray();
      const existingIds = existingDocs.map((doc) => doc._id.toString());

      // ids not found
      const bodyIds = list.map((id) => id.toString());
      const notFoundIds = bodyIds.filter((id) => !existingIds.includes(id));
      notFoundIds.forEach((id) => {
        rejects.failed.push({
          id,
          error: `ID or ${names.group.toLowerCase()} does not exist`,
        });
      });

      // delete docs
      if (existingIds.length > 0) {
        await collection.deleteMany({ _id: { $in: existingIds } });

        // Re-verify schema
        const remainingDocs = await collection.find({
          _id: { $in: existingIds },
        });
        const remainingIds = new Set(
          remainingDocs.map((doc) => doc._id.toString())
        );

        existingIds.forEach((id) => {
          if (remainingIds.has(id)) {
            rejects.failed.push({ id, error: `${names.group} not deleted` });
          } else {
            success.push(id);
          }
        });
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    data = data.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },

  // search
  search: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    const collection = client.collection(collectionName);

    const query = { _id: { $in: list.map((id) => new ObjectId(id)) } };
    const results = await collection.find(query).toArray();
    data = results.map((item) => formatData(item));

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
    findById: { messages: ["find(Id)"] },
    findWithFilter: { messages: ["find(Filter)"] },
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
export const persons = generateMethods(...payloadMethods);
