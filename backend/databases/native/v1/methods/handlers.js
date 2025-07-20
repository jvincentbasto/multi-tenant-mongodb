import { nextApiHandlers } from "@/dbs/nextApi/main";

// api handlers
const { response } = await nextApiHandlers.getMainVersion();
const { messages, response: apiResponse } = response.default;

// api response
const messageHandler = messages.standard.handler;
const responseSuccess = apiResponse.handlers.success;
const responseReject = apiResponse.handlers.reject;

// resource handlers
const generateMethods = (payload = {}, params = {}, options = {}) => {
  const { map = {}, test = false } = payload;

  // handlers
  const handler = (payload = {}) => {
    const { messages = [], fn } = payload;

    return async (payload = {}, params = {}, options = {}) => {
      const messageSuccess = messageHandler(2);
      const messageReject = messageHandler(1);
      const paramList = [payload, params, options];

      try {
        if (!fn) throw new Error("No Method defined");
        const fnResponse = await fn(...paramList);
        const { data, status } = fnResponse;

        const message = messageSuccess([...messages, data.message]);
        const payloadResponse = [{ ...data, message }, status];
        return responseSuccess(...payloadResponse);
      } catch (error) {
        const message = messageReject([...messages, error.message]);
        return responseReject({ message }, {});
      }
    };
  };
  const applyHandler = (map = {}) => {
    const handlers = {};

    for (const [key, value] of Object.entries(map)) {
      const { main = false } = value ?? {};

      if (main) {
        if (typeof value === "object" && value.fn) {
          handlers[key] = handler(value);
          continue;
        }

        handlers[key] = null;
        continue;
      }

      if (typeof value === "object") {
        // Recurse nested structures
        handlers[key] = applyHandler(value);
        continue;
      }

      handlers[key] = null;
    }

    return handlers;
  };

  const value = applyHandler(map);
  return value;
};

// utils
const getParams = (args = []) => {
  const [p1 = {}, p2 = {}, p3 = {}] = args;
  const list = [p1, p2, p3];

  return list;
};
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
    options: dataOptions,
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
  method: generateMethods,
  getParams,
  formatData,
};
