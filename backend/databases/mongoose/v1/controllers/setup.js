import { entryConfigs } from "../../../../configs/config.js";
import { setupDb } from "../db/setup.js";
import { handlers } from "./handlers.js";

//
const { env: configEnv } = entryConfigs;
const dbMaster = configEnv.db.names.admin;
const dbTest = configEnv.db.names.test;

// context
const { responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;

//
const ctxArgs = {
  payload: { client: {}, conn: { name: dbMaster }, model: {} },
  params: { enable: { client: true, conn: false, model: false } },
};

// initialize collections
const setupAppDb = setupDb.app;

// main
const setupApp = async (req, res) => {
  try {
    // const payloadContext = { req, ...ctxArgs.payload };
    // const paramContext = { ...ctxArgs.params };
    // const ctx = await getContext(payloadContext, paramContext);
    // const { client } = ctx;

    const params = req.params;

    const responseData = await setupAppDb({ ...params });
    const responseTest = await setupAppDb({ name: dbTest, ...params });

    const response = responseSuccess({ res, ...responseData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const setup = {
  app: setupApp,
};
