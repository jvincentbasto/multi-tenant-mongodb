import { methods } from "../methods/main/main";
import { mongoNativeDb } from "./db/main";

export const mongoNativeV1 = {
  db: mongoNativeDb,
  methods,
};
