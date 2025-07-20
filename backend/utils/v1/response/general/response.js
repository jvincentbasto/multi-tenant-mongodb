const handler = (payload = {}) => {
  const { res, status = 500, json = {} } = payload;
  const { success = false, data = [], message = "", ...rest } = json;

  const curJson = { success, data, message, ...rest };

  const response = res.status(status).json(curJson);
  return response;
};
const success = (payload = {}) => {
  const { res, status = 200, message = "Successful", ...rest } = payload;

  const curJson = { success: true, message, ...rest };
  const curPayload = { res, status, json: curJson };

  const response = handler(curPayload);
  return response;
};
const failed = (payload = {}) => {
  const { res, error, ...rest } = payload;

  const status = error.status || 400;
  const message = error.message || "Internal Server Error";

  const curJson = { success: false, message, ...rest };
  const curPayload = { res, status, json: curJson };

  const response = handler(curPayload);
  return response;
};
const handlers = {
  success,
  failed,
};

export const response = {
  handlers,
};
