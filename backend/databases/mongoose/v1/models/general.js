import { handlers } from "./handlers.js";

const { getModel: getModelHandler } = handlers;

const getModel = async (payload = {}) => {
  const exclude = [
    "schemas",
    "apps",
    "users",
    "person",
    "userTypes",
    "sessions",
  ];
  const { name } = payload;

  if (exclude.includes(name)) {
    return null;
  }

  return await getModelHandler(payload);
};

export const general = {
  getModel,
};
