import { mongooseHandlers } from "../mongoose/main/main.js";
// import { mongoNativeHandlers } from "../native/main/main.js";

const clients = {
  mongoose: mongooseHandlers,
  mongodb: mongooseHandlers,
  // mongodb: mongoNativeHandlers,
};

export const databases = { clients };
