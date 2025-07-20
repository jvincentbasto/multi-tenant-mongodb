import mongoose from "mongoose";

// typeMap
const typeMap = {
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Array: Array,
  Object: Object,
  Mixed: mongoose.Schema.Types.Mixed,
  ObjectId: mongoose.Schema.Types.ObjectId,
  Buffer: Buffer,
  Map: Map,
};

//
const convertToSchema = (payload = {}) => {
  const { definition } = payload;

  const isObject = typeof definition === "object" && !Array.isArray(definition);

  let parse;
  try {
    parse = isObject ? definition : JSON.parse(definition);
  } catch {
    parse = null;
  }
  if (!parse) return null;

  const mapField = (field) => {
    if (typeof field === "object" && field.type) {
      const mappedType = typeMap[field.type];
      if (!mappedType) {
        throw new Error(`Unsupported type: ${field.type}`);
      }

      // Handle arrays with `items` key for defining the type of array elements
      if (field.type === "Array") {
        if (field.items) {
          const itemType = typeMap[field.items?.type || field.items];
          if (!itemType) {
            throw new Error(`Unsupported array item type: ${field.items}`);
          }

          const baseItem = { type: itemType };
          if (field.items.ref) {
            baseItem.ref = field.items.ref;
          }

          return {
            ...field,
            type: [baseItem],
          };
        }

        // default to generic array
        return {
          ...field,
          type: [mongoose.Schema.Types.Mixed],
        };
      }

      return {
        ...field,
        type: mappedType,
      };
    }

    // Simple string type like `"String"`
    if (typeof field === "string") {
      const mappedType = typeMap[field];
      if (!mappedType) {
        throw new Error(`Unsupported type: ${field}`);
      }
      return { type: mappedType };
    }

    return field;
  };

  const schema = Object.fromEntries(
    Object.entries(parse).map(([key, val]) => [key, mapField(val)])
  );

  return schema;
};
const getSchemaDefinition = async (payload = {}) => {
  try {
    const { conn, collectionName = "schemas", name = "schemas" } = payload;

    // get schema collection
    const schemaCollection = await conn.db.collection(collectionName);

    // get schema definition from schema collection
    const results = await schemaCollection.find({ name }).toArray();
    const formattedDocs = results.map((res) => {
      const { _id, __v, ...rest } = res;

      const results = { ...rest };
      return results;
    });

    return formattedDocs ?? [];
  } catch (error) {
    return [];
  }
};
const setModelIndex = async (payload = {}) => {
  try {
    const { conn, Model, collectionName, body = {} } = payload;
    const { name, keys = {}, options: indexOptions = {} } = body;

    if (!conn) {
      throw new Error("Missing db connection");
    }
    if (!Model) {
      throw new Error("Missing model");
    }
    if (!collectionName || !name) {
      throw new Error("Missing index names");
    }

    const indexKey = `${collectionName}.${name}`;
    const hasIndex = conn.custom.indices.has(indexKey);
    if (hasIndex) {
      return Model;
    }

    const emptyKeys = Object.keys(keys).length <= 0;
    const emptyOptions = Object.keys(indexOptions).length <= 0;
    if (emptyKeys || emptyOptions) {
      return Model;
    }

    await Model.collection.createIndex(keys, indexOptions);
    conn.custom.indices.add(indexKey);

    return Model;
  } catch (error) {
    return null;
  }
};

const timestamps = {
  definition: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  map: {
    createdAt: { type: "Date", default: Date.now },
    updatedAt: { type: "Date", default: Date.now },
  },
};

export const handlers = {
  typeMap,
  convertToSchema,
  getSchemaDefinition,
  setModelIndex,
  timestamps,
};
