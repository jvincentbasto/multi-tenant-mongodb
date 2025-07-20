import { expressHandlers } from "../express/main/index.js";
// import { fastifyHandlers } from "../fastify/main/index.js";

export const routerHandlers = {
  express: expressHandlers,
  fastify: expressHandlers,
  // fastify: fastifyHandlers
};
