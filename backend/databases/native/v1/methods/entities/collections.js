import { nextApiHandlers } from "@/dbs/nextApi/main";

import { handlers } from "../handlers";

import { collections as methodCollections } from "../collections";
import { schemas as methodSchemas } from "../schemas";

//
const names = {
  type: "Method",
  group: "Collection",
};
const collectionNames = {
  schemas: "schemas",
};
const messageList = [names.type, names.group];

//
const { request, response } = await nextApiHandlers.getMainVersion();
const { entities: entityHandlers } = request.default;
const { response: apiResponse } = response.default;
const { handlers: apiHandlers, constants: apiConstants } = apiResponse;

//
// const bulkResponse = apiConstants.response.bulk;
const responseSuccess = apiHandlers.success;
// const responseReject = apiHandlers.reject;

//
const resource1 = methodCollections;
const resource2 = methodSchemas;

// handlers
const generateMethods = handlers.method;
const formatData = handlers.formatData;
const getParams = handlers.getParams;

// handlers
const getArgs = (payload = {}) => {
  const { list = [], placeholder } = payload;

  const names = ["collections", "schemas"];
  const map = entityHandlers.args.getArgs({ list, names, placeholder });
  return map;
};
const matchResponse = (payload = {}, params = {}, options = {}) => {
  const { payload1 = {}, payload2 = {} } = payload;
  const { data: data1 = [], field: field1 = [] } = payload1;
  const { data: data2 = [], field: field2 = [] } = payload2;

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
const methods = {
  find: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { client } = payload;

    let results1 = await client.db.listCollections().toArray();
    let formatted1 = results1.map((item) => formatData(item));

    const collection = client.collection(collectionNames.schemas);
    let results2 = await collection.find({}).toArray();
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

    const response = responseSuccess({ data, resources });
    return response;
  },
  findByName: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id: name } = apiParams;

    const collections = await client.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));

    const collection2 = client.collection(collectionNames.schemas);
    let results2 = await collection2.find({ name }).toArray();
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

    const response = responseSuccess({ data, resources });
    return response;
  },
  findById: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id: name } = apiParams;

    const collections = await client.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));

    const collection2 = client.collection(collectionNames.schemas);
    let results2 = await collection2.find({ name }).toArray();
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

    const response = responseSuccess({ data, resources });
    return response;
  },
  findWithFilter: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { client } = payload;

    let results1 = await client.db.listCollections().toArray();
    let formatted1 = results1.map((item) => formatData(item));

    const collection2 = client.collection(collectionNames.schemas);
    let results2 = await collection2.find({}).toArray();
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

    const response = responseSuccess({ data, resources });
    return response;
  },
  create: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { body } = api.all;
    const { name } = body;

    const collections1 = await client.db.listCollections().toArray();
    const match = collections1.some((col) => col.name === name);
    if (match) {
      throw new Error(`${names.group} already exist: "${name}"`);
    }

    await client.db.createCollection(name);
    const collections2 = await client.db.listCollections().toArray();
    let results1 = collections2.filter((col) => col.name === name);
    let formatted1 = results1.map((item) => formatData(item));
    if (results1.length <= 0) {
      throw new Error(
        `Cannot find created ${names.group.toLowerCase()}: "${name}"`
      );
    }

    const collection2 = client.collection(collectionNames.schemas);
    let results2 = await collection2.insertOne(body);
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

    const response = responseSuccess({ data, resources });
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
    const clientCollections = await client.db.listCollections().toArray();
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

    await client.db.renameCollection(source, target);
    const collections = await client.db.listCollections().toArray();
    let results1 = collections.filter((col) => col.name === target);
    let formatted1 = results1.map((item) => formatData(item));
    if (formatted1.length <= 0) {
      throw new Error(
        `Cannot find updated target ${names.group.toLowerCase()}: "${target}"`
      );
    }

    const collection2 = client.collection(collectionNames.schemas);
    const query = { name: source };
    const results2 = await collection2.updateOne(query, { $set: body });
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

    const response = responseSuccess({ data, resources });
    return response;
  },
  delete: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { params: apiParams } = api.all;
    const { id: name } = apiParams;

    const clientCollections = await client.db.listCollections().toArray();
    const sourceMatch = clientCollections.some((col) => col.name === name);
    if (!sourceMatch) {
      throw new Error(
        `Source ${names.group.toLowerCase()} does not exist: "${name}"`
      );
    }

    await client.dropCollection(name);
    const collections = await client.db.listCollections().toArray();
    const results1 = collections.some((col) => col.name === name);
    if (results1) {
      throw new Error(`${names.group} was not deleted: "${name}"`);
    }
    let formatted1 = [{ data: name }];

    const collection2 = client.collection(collectionNames.schemas);
    let results2 = await collection2.deleteOne({ name });
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

    const response = responseSuccess({ data, resources });
    return response;
  },

  // bulk
  findMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const defaultArgs = [payload, params, options];
    const { args1, args2 } = getArgs({ list: defaultArgs });

    const response1 = await resource1.findMany(...args1);
    const response2 = await resource2.findMany(...args2);

    const resources = {
      collections: response1.data,
      schemas: response1.data,
    };
    const data = [response1.data.data, response2.data.data];

    const response = responseSuccess({ data, resources });
    return response;
  },
  createMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const defaultArgs = [payload, params, options];
    const { args1, args2 } = getArgs({ list: defaultArgs });

    const response1 = await resource1.createMany(...args1);
    const response2 = await resource2.createMany(...args2);

    const resources = {
      collections: response1.data,
      schemas: response1.data,
    };
    const data = [response1.data.data, response2.data.data];

    const response = responseSuccess({ data, resources });
    return response;
  },
  updateMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const defaultArgs = [payload, params, options];
    const { args1, args2 } = getArgs({ list: defaultArgs });

    const response1 = await resource1.updateMany(...args1);
    const response2 = await resource2.updateMany(...args2);

    const resources = {
      collections: response1.data,
      schemas: response1.data,
    };
    const data = [response1.data.data, response2.data.data];

    const response = responseSuccess({ data, resources });
    return response;
  },
  deleteMany: async (...args) => {
    const [payload, params, options] = getParams(args);

    const defaultArgs = [payload, params, options];
    const { args1, args2 } = getArgs({ list: defaultArgs });

    const response1 = await resource1.deleteMany(...args1);
    const response2 = await resource2.deleteMany(...args2);

    const resources = {
      collections: response1.data,
      schemas: response1.data,
    };
    const data = [response1.data.data, response2.data.data];

    const response = responseSuccess({ data, resources });
    return response;
  },

  // search
  search: async (...args) => {
    const [payload, params, options] = getParams(args);

    const defaultArgs = [payload, params, options];
    const { args1, args2 } = getArgs({ list: defaultArgs });

    const response1 = await resource1.search(...args1);
    const response2 = await resource2.search(...args2);

    const resources = {
      collections: response1.data,
      schemas: response1.data,
    };
    const data = [response1.data.data, response2.data.data];

    const response = responseSuccess({ data, resources });
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
export const collections = generateMethods(...payloadMethods);
