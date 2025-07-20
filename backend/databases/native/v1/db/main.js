import { multipleDb } from "./multiple";
import { singleDb } from "./single";

export const mongoNativeDb = {
  single: singleDb,
  multiple: multipleDb,
};
