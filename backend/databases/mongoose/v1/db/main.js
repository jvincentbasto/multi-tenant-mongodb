import { multiple } from "./multiple.js";
import { setupDb } from "./setup.js";
import { single } from "./single.js";

export const db = {
  single,
  multiple,
  setup: setupDb,
};
