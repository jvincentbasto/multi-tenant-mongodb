import { nextApiHandlers } from "@/dbs/nextApi/main";

// api handlers
const { response } = await nextApiHandlers.getMainVersion();
const { messages, response: apiResponse } = response.default;

// api response
const messageHandler = messages.standard.handler;
// const responseSuccess = apiResponse.handlers.success;
const responseReject = apiResponse.handlers.reject;
const responseOptions = { response: true };

// resource handlers
const generateMiddleware = (payload = {}, params = {}, options = {}) => {
  const { map = {}, test = false } = payload;

  // handlers
  const handler = (payload = {}) => {
    const { messages = [], fn } = payload;

    return (nextHandler) => async (req, context) => {
      // const messageSuccess = messageHandler(2);
      const messageReject = messageHandler(1);
      const base = [req, context];

      try {
        if (!fn) throw new Error("No Middleware defined");
        const fnResponse = await fn(...base);
        const { req, context } = fnResponse;

        if (!nextHandler) throw new Error("No Handler defined");
        return nextHandler(req, context);
      } catch (error) {
        const message = messageReject([...messages, error.message]);
        return responseReject({ message }, {}, responseOptions);
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

  const { _id, __v, password, ...rest } = currentData;
  const formattedDocs = {
    ...(_id ? { id: _id } : null),
    ...rest,
  };

  return formattedDocs;
};

export const handlers = {
  method: generateMiddleware,
  getParams,
  formatData,
};
