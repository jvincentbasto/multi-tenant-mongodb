import mongoose from "mongoose";

import { schemas as schemaHandlers } from "../schemas/main/main.js";
import { templates } from "../../../templates/main/main.js";

// schema handlers
const getDefinition = schemaHandlers.handlers.getDefinition;
const convertToSchema = schemaHandlers.handlers.convertToSchema;

// templates
const { v1: templateHandlers } = templates.versions;
const { schemas: templateSchemas } = templateHandlers;
const setModelIndex = templateSchemas.handlers.setModelIndex;

// model handlers
const getModel = async (payload = {}) => {
  try {
    const { name, conn } = payload;
    const connection = conn;

    const models = connection.models;
    if (models[name]) {
      delete connection.models[name];
    }

    // get schema definition from db
    let schemaDefinition;
    let indices = [];
    try {
      const [schema = {}] = await getDefinition({ conn, name });
      schemaDefinition = convertToSchema({ definition: schema.definition });
      indices = JSON.parse(schema.indices || "[]") ?? [];
    } catch (err) {
      schemaDefinition = null;
      indices = [];
    }
    if (!schemaDefinition) return null;

    // create schema
    const newScheama = new mongoose.Schema(schemaDefinition, {
      collection: name,
    });

    // create model
    let Model = connection.model(name, newScheama);
    if (!Model) return null;

    // create indices
    for (const index of indices) {
      const payloadIndex = {
        conn,
        Model,
        collectionName: name,
        body: index,
      };
      Model = setModelIndex(payloadIndex);
    }

    return Model;
  } catch (error) {
    return null;
  }
};

export const handlers = {
  getModel,
};
