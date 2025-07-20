import { config } from "./main/config.js";

const base = config.base;

const getOriginType = async (payload = {}, params = {}, options = {}) => {
  const { req, res } = payload;

  const headers = req.headers || {};
  const origin = headers["origin"];
  const referer = headers["referer"];
  const currentOrigin = origin ?? referer;

  //
  const siteOrigin = {
    same: 1,
    cross: 2,
  };

  const isProduction = process.env.NODE_ENV === "production";
  const currentSiteOrigin =
    currentOrigin === base ? siteOrigin.same : siteOrigin.cross;

  const originType = {
    headers: {
      origin,
      referer,
      currentOrigin,
    },
    isProduction,
    origin: currentSiteOrigin,
  };

  return originType;
};

export const handlers = {
  getOriginType,
};
