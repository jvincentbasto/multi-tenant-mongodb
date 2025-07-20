import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

const emailVerificationTokens = {
  names: {
    collection: "emailVerificationTokens",
    model: "EmailVerificationToken",
  },
  definition: {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    hashed: String,
    used: { type: Boolean, default: false },
    expiresAt: Date,
    ...timestamps.definition,
  },
  map: {
    User: { type: "ObjectId", ref: "User", required: true },
    email: { type: "String", required: true, unique: true },
    token: { type: "String", required: true },
    hashed: "String",
    used: { type: "Boolean", default: false },
    expiresAt: "Date",
    ...timestamps.map,
  },
  indices: [
    {
      name: "expiresAt",
      keys: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 },
    },
  ],
  data: [],
};
const otpTokens = {
  names: {
    collection: "otpTokens",
    model: "OtpToken",
  },
  definition: {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    hashed: String,
    used: { type: Boolean, default: false },
    expiresAt: Date,
    ...timestamps.definition,
  },
  map: {
    User: { type: "ObjectId", ref: "User", required: true },
    token: { type: "String", required: true },
    hashed: "String",
    used: { type: "Boolean", default: false },
    expiresAt: "Date",
    ...timestamps.map,
  },
  indices: [
    {
      name: "expiresAt",
      keys: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 },
    },
  ],
  data: [],
};

export const tokenCollections = {
  emailVerificationTokens,
  otpTokens,
};
