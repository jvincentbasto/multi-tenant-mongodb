import { utils } from "../../../../utils/main/main.js";
import { db } from "../db/main.js";
import { models } from "../models/main/main.js";

//
const { v1: utilHandlers } = utils.versions;
const { default: defRequest } = utilHandlers.request;
const { default: defResponse } = utilHandlers.response;

// utils
const constBulk = defRequest.constants.getBulk;
const responseSuccess = defResponse.response.handlers.success;
const responseFailed = defResponse.response.handlers.failed;
const controllerUtils = {
  constBulk,
  responseSuccess,
  responseFailed,
};

// apply custom values
const applyCustomValues = (req, res, next) => {
  const curParams = req?.params ?? {};
  const curCustomParams = req?.custom?.params ?? {};

  const params = {
    ...curCustomParams,
    ...curParams,
  };

  req.params = params;
  return params;
};

// context
const dbHandler = db.multiple;
const getClient = async (payload = {}) => {
  const { req, res, enable = true } = payload;
  const { env, region } = req.params;

  const client = enable ? await dbHandler.getClient({ env, region }) : null;
  return client;
};
const getDbConnection = async (payload = {}) => {
  const { req, res, enable = true } = payload;
  const { env, region, db } = req.params;

  const conn = enable ? await dbHandler.connect({ env, region, db }) : null;
  return conn;
};
const getModel = async (payload = {}) => {
  const { dynamic = false, conn, name } = payload;

  const fnHandler = dynamic ? models.handlers : models.general;
  const fn = fnHandler.getModel({ conn, name });

  return fn;
};
const getContext = async (payload = {}, params = {}) => {
  const {
    req,
    client: payloadClient = {},
    conn: payloadConn = {},
    model: payloadModel = {},
  } = payload;
  const { enable = {}, bulk: bulkParams = {} } = params;

  // payloads
  // const {} = payloadClient
  // const {} = payloadConn
  const { models = [] } = payloadModel;

  // enables
  const {
    client: enableClient = false,
    conn: enableConn = true,
    model: enableModel = true,
  } = enable;
  // enables

  // bulk enables
  const {
    // client: enableBulkClient = false,
    // conn: enableBulkConn = false,
    model: enableBulkModel = false,
  } = bulkParams;

  // ctx
  let query = req.query;
  let reqParams = req.params;
  let body = req.body ? { ...req.body } : undefined;
  let bulk = [];
  //
  reqParams = applyCustomValues(req);

  //
  const { model: name } = req.params;
  const curModelName = payloadModel.name ?? name;

  // client
  let client;
  if (enableClient) {
    client = await getClient({ req, ...payloadClient });
    if (!client) throw new Error("Client not found");
  }

  // db
  let conn;
  if (enableConn) {
    conn = await getDbConnection({ req, ...payloadConn });
    if (!conn) throw new Error("DB not found");
  }

  // model
  let Model;
  let Models = [];
  if (enableModel && !enableBulkModel) {
    Model = await getModel({ conn, name: curModelName, ...payloadModel });
    if (!Model) throw new Error("Model not found");
  }
  if (enableBulkModel) {
    Models = await Promise.all(
      models.map((name) => getModel({ conn, name, ...payloadModel }))
    );

    //
    const validModels = Models.every((item) => item);
    if (!validModels) throw new Error("Some models are missing");
  }

  const context = {
    query,
    params: reqParams,
    body,
    bulk,
    //
    client,
    conn,
    Model,
    Models,
  };

  return context;
};

// format
const formatData = (data = {}, options = {}) => {
  const { toObject: enableToObject = true } = options;

  if (!data) return null;

  let currentData = data ?? {};
  if (enableToObject) {
    currentData = typeof data?.toObject === "function" ? data.toObject() : data;
  }

  const {
    _id,
    __v,
    //
    password,
    //
    options: optionData,
    type,
    info,
    idIndex,
    ...rest
  } = currentData;
  const formattedDocs = {
    ...(_id ? { id: _id } : null),
    ...rest,
  };

  return formattedDocs;
};

export const handlers = {
  getContext,
  formatData,
  utils: controllerUtils,
};
