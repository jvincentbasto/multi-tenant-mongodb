import mongoose from "mongoose";

import { templates } from "../../../../templates/main/main.js";

const { v1: templateHandlers } = templates.versions;
const { schemas: templateSchemas } = templateHandlers;
const { schema } = templateSchemas.schemas;

// defaults
const name = schema.names.model;
const definition = schema.definition;
const CollectionSchema = new mongoose.Schema(definition, {
  timestamps: true,
});

// handlers
const typeMap = templateSchemas.handlers.typeMap;
const convertToSchema = templateSchemas.handlers.convertToSchema;
const getSchemaDefinition = templateSchemas.handlers.getSchemaDefinition;
const getSchemaModel = async (payload = {}, params = {}, options = {}) => {
  const { conn } = payload;
  const connection = conn || mongoose;

  // get schema definition from db
  let schemaDefinition;
  try {
    const [schema = {}] = await getSchemaDefinition({ conn });
    schemaDefinition = convertToSchema({ definition: schema.definition });
  } catch {
    schemaDefinition = null;
  }
  if (!schemaDefinition) return null;

  // create schema
  const newScheama = new mongoose.Schema(schemaDefinition, {
    collection: schema.names.collection,
  });
  const currentSchema = newScheama ?? CollectionSchema;

  // create model
  let Model = connection.models[name] ?? connection.model(name, currentSchema);
  if (!Model) return null;

  return Model;
};
export const handlers = {
  types: typeMap,
  convertToSchema,
  getDefinition: getSchemaDefinition,
  getModel: getSchemaModel,
};
