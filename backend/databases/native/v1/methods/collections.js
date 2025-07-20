import { nextApiHandlers } from "@/dbs/nextApi/main";

import { handlers } from "./handlers";

//
const names = {
  type: "Method",
  group: "Collection",
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

// main
const methods = {
  find: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const collections = await client.listCollections().toArray();
    const results = collections ?? [];
    const formattedData = results.map((item) => formatData(item));

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  findByName: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id: name } = apiParams;

    const collections = await client.listCollections().toArray();
    const results = collections.filter((col) => col.name === name);
    const formattedData = results.map((item) => formatData(item));

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  create: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { body } = api.all;
    const { name } = body;

    const collections = await client.listCollections().toArray();
    const match = collections.some((col) => col.name === name);

    if (match) {
      throw new Error(`${names.group} already exist: "${name}"`);
    }

    await client.createCollection(name);

    const newCollections = await client.listCollections().toArray();
    const results = newCollections.filter((col) => col.name === name);
    const formattedData = results.map((item) => formatData(item));

    if (results.length <= 0) {
      throw new Error(
        `Cannot find created ${names.group.toLowerCase()}: "${name}"`
      );
    }

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  update: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams, body } = api.all;
    const { id: source } = apiParams;
    const { name: target } = body;

    if (!source || !target) {
      throw new Error("Both source and target are required");
    }

    const clientCollections = await client.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === source);
    const targetMatch = clientCollections.some((col) => col.name === target);

    if (!sourceMatch) {
      throw new Error(
        `Source ${names.group.toLowerCase()} does not exist: "${source}"`
      );
    }
    if (targetMatch) {
      throw new Error(
        `Target ${names.group.toLowerCase()} already exist: "${target}"`
      );
    }

    await client.collection(source).rename(target);
    const collections = await client.listCollections().toArray();
    const results = collections.filter((col) => col.name === target);
    const formattedData = results.map((item) => formatData(item));

    if (results.length <= 0) {
      throw new Error(
        `Cannot find updated target ${names.group.toLowerCase()}: "${target}"`
      );
    }

    const response = responseSuccess({ data: formattedData });
    return response;
  },
  drop: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id: name } = apiParams;

    const clientCollections = await client.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === name);

    if (!sourceMatch) {
      throw new Error(
        `Source ${names.group.toLowerCase()} does not exist: "${name}"`
      );
    }

    await client.collection(name).drop();

    const collections = await client.listCollections().toArray();
    const match = collections.some((col) => col.name === name);

    if (match) {
      throw new Error(`${names.group} was not deleted: "${name}"`);
    }

    const results = [{ data: name }];

    const response = responseSuccess({ data: formattedData });
    return response;
  },

  // bulk
  findMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Empty list");
    }

    const collections = await client.listCollections().toArray();
    rejects.failed = collections.filter((col) => !list.includes(col.name));
    const results = collections.filter((col) => list.includes(col.name));
    data = results.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  createMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Empty list");
    }

    const createCollection = async (name) => {
      const collections = await client.listCollections().toArray();
      const match = collections.some((col) => col.name === name);

      if (match) {
        rejects.duplicates.push({
          name,
          message: `${names.group} already exist`,
        });
        return;
      }

      await client.createCollection(name);

      const newCollections = await client.listCollections().toArray();
      const newMatch = newCollections.some((col) => col.name === name);

      if (!newMatch) {
        rejects.failed.push({
          name,
          message: `Cannot find created ${names.group}: "${name}"`,
        });
        return;
      }

      data.push({ name });
    };

    for (const item of list) {
      await createCollection(item);
    }
    data = results.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  updateMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Empty list");
    }

    const updateCollections = async (payload) => {
      const { source, target } = payload;

      if (!source || !target) {
        rejects.failed.push({
          ...payload,
          message: "Both source and target are required",
        });
        return;
      }

      const clientCollections = await client.listCollections().toArray();
      const sourceMatch = clientCollections.some((col) => col.name === source);
      const targetMatch = clientCollections.some((col) => col.name === target);

      if (!sourceMatch) {
        rejects.notFound.push({
          ...payload,
          message: `Source ${names.group.toLowerCase()} does not exist: "${source}"`,
        });
        return;
      }
      if (targetMatch) {
        rejects.duplicates.push({
          ...payload,
          message: `Target ${names.group.toLowerCase()} already exist: "${target}"`,
        });
        return;
      }

      await client.collection(source).rename(target);
      const collections = await client.listCollections().toArray();
      const match = collections.some((col) => col.name === target);

      if (!match) {
        rejects.failed.push({
          ...payload,
          message: `Cannot find updated target ${names.group.toLowerCase()}: "${source}"`,
        });
        return;
      }

      data.push({ payload });
    };

    for (const item of list) {
      await updateCollections(item);
    }
    data = results.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },
  deleteMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Empty list");
    }

    const dropCollections = async (name) => {
      const clientCollections = await client.listCollections().toArray();
      const sourceMatch = clientCollections.some((col) => col.name === name);

      if (!sourceMatch) {
        rejects.notFound.push({
          name,
          message: `Source ${names.group.toLowerCase()} does not exist: "${name}"`,
        });
        return;
      }

      await client.collection(name).drop();

      const collections = await client.listCollections().toArray();
      const match = collections.some((col) => col.name === name);

      if (!match) {
        rejects.failed.push({
          name,
          message: `${names.group} was not deleted: "${name}"`,
        });
        return;
      }

      data.push({ name });
    };

    for (const item of list) {
      await dropCollections(item);
    }
    data = results.map((item) => formatData(item));

    const response = responseSuccess({ data, rejects });
    return response;
  },

  // search
  search: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { bulk: list = [] } = api.all;

    let bulkLists = bulkResponse();
    let { success: data, rejects } = bulkLists;

    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Empty list");
    }

    const collections = await client.listCollections().toArray();
    rejects.failed = collections.filter((col) => !list.includes(col.name));
    const results = collections.filter((col) => list.includes(col.name));
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
    findById: { messages: ["find(Id)"] },
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
export const collections = generateMethods(...payloadMethods);
