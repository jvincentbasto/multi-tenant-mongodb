import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

const schemaType = {
  names: {
    collection: "schemaTypes",
    model: "SchemaType",
  },
  definition: {
    name: { type: String, required: true },
    type: Number,
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    type: "Number",
    ...timestamps.map,
  },
  data: [
    { name: "Normal", type: 0 },
    { name: "System", type: 1 },
  ],
};
const schema = {
  names: {
    collection: "schemas",
    model: "Schema",
  },
  definition: {
    name: { type: String, required: true },
    definition: { type: String, required: true },
    indices: { type: String },
    SchemaType: { type: mongoose.Schema.Types.ObjectId, ref: "SchemaType" },
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    definition: { type: "String" },
    indices: { type: "String" },
    SchemaType: { type: "ObjectId", ref: "SchemaType" },
    ...timestamps.map,
  },
};

export const schemaCollections = {
  schemaType,
  schema,
};
