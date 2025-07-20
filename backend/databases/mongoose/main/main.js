import { mongooseV1 } from "../v1/main/main.js";
// import { mongooseV2 } from "../v2/main/main.js";

const versions = {
  v1: mongooseV1,
  // v2: mongooseV2,
  v2: mongooseV1,
};

export const mongooseHandlers = {
  versions: versions,
};
