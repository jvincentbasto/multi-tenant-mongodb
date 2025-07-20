import mongoose from "mongoose";
import { templates } from "../../../templates/main/main.js";

const { v1: templateHandlers } = templates.versions;
const { schemas: templateSchemas } = templateHandlers;
const { schema } = templateSchemas.schemas;

const name = schema.names.model;
const definition = schema.definition;

const CollectionSchema = new mongoose.Schema(definition, {
  timestamps: true,
});
const Model = mongoose.models.Schema || mongoose.model(name, CollectionSchema);
export default Model;

export const schemaSchema = {
  name,
  model: Model,
  schema: CollectionSchema,
};
