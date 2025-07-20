import express from "express";

import { entryConfigs } from "../../configs/config.js";
import { routes } from "./routes.js";

const router = express.Router({ mergeParams: true });

// configs
const { constants, configs } = entryConfigs;

//
const appendCustomValues = (req) => {
  const params = req?.params ?? {};
  const customParams = req?.custom?.params ?? {};

  const custom = {
    params: {
      ...params,
      ...customParams,
    },
  };

  req.custom = custom;
};
const middlewares = {
  clients: (payload = {}) => {
    // const {} = payload

    return (req, res, next) => {
      const { client, version } = req.params;

      // current
      let curClient = client;
      let curVersion = version;
      if (!client) curClient = configs.db.client;
      if (!version) curVersion = configs.db.version;

      // validate
      const valid = {
        client: constants.clients?.[curClient],
        version: constants.versions?.[curVersion],
      };

      // set
      const curParams = {
        ...req.params,
        client: valid.client ? curClient : undefined,
        version: valid.version ? curVersion : undefined,
      };
      req.params = curParams;
      appendCustomValues(req);

      // log path
      let curPath = "404";
      if (client && version) curPath = "/:client/:version";
      if (!client && version) curPath = "/:version";
      if (client && !version) curPath = "/:client";
      if (!client && !version) curPath = "default /client/version";
      // console.log(`route -> ${curPath}`, req.params);

      next();
    };
  },
  envs: (payload = {}) => {
    // const {} = payload

    return (req, res, next) => {
      const { env, region } = req.params;

      // current
      let curEnv = env;
      let curRegion = region;
      if (!env) curEnv = configs.db.env;
      if (!region) curRegion = configs.db.region;

      // validate
      const valid = {
        env: constants.envs?.[curEnv],
        region: constants.regions?.[curRegion],
      };

      // set
      const curParams = {
        ...req.params,
        env: valid.env ? curEnv : undefined,
        region: valid.region ? curRegion : undefined,
      };
      req.params = curParams;
      appendCustomValues(req);

      // log path
      let curPath = "404";
      if (env && region) curPath = "/:env/:region";
      if (!env && region) curPath = "/:region";
      if (env && !region) curPath = "/:env";
      if (!env && !region) curPath = "default /env/region";
      // console.log(`route -> ${curPath}`, req.params);
      console.log("url", req.originalUrl);

      next();
    };
  },
};

// base paths
const basePaths = {
  clients: {
    clientVersion: {
      type: "clientVersion",
      enable: true,
      url: "/clients/:client/versions/:version",
    },
    version: {
      type: "version",
      enable: true,
      url: "/versions/:version",
    },
    client: {
      type: "client",
      enable: true,
      url: "/clients/:client",
    },
    root: {
      type: "root",
      enable: true,
      url: "",
    },
  },
  envs: {
    envRegion: {
      type: "envRegion",
      enable: configs.db.enable.env ?? false,
      url: "/envs/:env/regions/:region",
    },
    region: {
      type: "region",
      enable: true,
      url: "/regions/:region",
    },
    env: {
      type: "env",
      enable: true,
      url: "/envs/:env",
    },
    root: {
      type: "root",
      enable: true,
      url: "",
    },
  },
};

const combinePaths = () => {
  const { clients, envs } = basePaths;
  const clientEntries = Object.entries(clients);
  const envEntries = Object.entries(envs);

  for (const [clientKey, clientValue] of clientEntries) {
    if (!clientValue.enable) continue;

    //
    for (const [envKey, envValue] of envEntries) {
      if (!envValue.enable) continue;

      const urlLog = [clientValue.url, envValue.url];
      // console.log("urlLog", urlLog);

      const curUrl = `${clientValue.url}${envValue.url}`;
      routes.getRoutes({ router, url: curUrl, middlewares });
    }
  }
};
combinePaths();

export const base = {
  router,
};
