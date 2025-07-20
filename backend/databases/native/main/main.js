import { mongoNativeV1 } from "../v1/main/main.js";
import { mongoNativeV2 } from "../v2/main/main.js";

const versions = {
  v1: mongoNativeV1,
  // v2: mongoNativeV2,
  v2: mongoNativeV1,
};

export const mongoNativeHandlers = {
  versions,
};
