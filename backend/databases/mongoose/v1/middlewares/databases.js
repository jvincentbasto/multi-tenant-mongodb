import { entryConfigs } from "../../../../configs/config.js";
import { services } from "../../../../services/main/main.js";
import { handlers } from "./handlers.js";

//
const { env: configEnv } = entryConfigs;
const dbMaster = configEnv.db.names.admin;

// context
const { responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: { name: dbMaster }, model: { dynamic: true } },
  params: { enable: {}, bulk: { model: true } },
};

// services
const { jwt } = services;
const { accessToken, refreshToken } = jwt.handlers;

//
const collectionNames = {
  sessions: "sessions",
  users: "users",
  persons: "persons",
  userTypes: "userTypes",
};

// middlewares
const verifyAuth = async (req, res, next) => {
  try {
    const models = [
      collectionNames.sessions,
      collectionNames.users,
      collectionNames.persons,
      collectionNames.userTypes,
    ];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, Models } = ctx;
    const { region, env } = params;
    const [Model1, Model2, Model3, Model4] = Models;

    // verify access token
    const accToken = await accessToken.getToken({ req, res });
    const decodedAccToken = await accessToken.verifyToken({
      token: accToken,
    });
    if (!decodedAccToken) {
      throw new Error("Unauthorized, no token provided");
    }

    // verify refresh token
    const refToken = await refreshToken.getCookie({ req, res, region, env });
    const decodedRefToken = await refreshToken.verifyToken({
      token: refToken,
    });
    if (!decodedRefToken) {
      throw new Error("Unauthorized, no token provided");
    }

    // match jti
    const accJti = decodedAccToken.id;
    const refJti = decodedRefToken.id;
    const hasEmptyJti = [accJti, refJti].some((item) => !item);

    if (hasEmptyJti || accJti !== refJti) {
      throw new Error("Unauthorized, no token provided");
    }

    const match1 = await Model1.findOne({ token: decodedRefToken.token });
    const session = formatData(match1);
    if (!session) {
      throw new Error("Session not found");
    }

    // delete expired session
    if (session.expiresAt < new Date()) {
      await Model1.deleteOne({ _id: session.id });
      throw new Error("Session expired, please login again");
    }

    const match2 = await Model2.findById(session.User).populate([
      { path: "Person", model: Model3 },
      { path: "UserType", model: Model4 },
    ]);
    const user = formatData(match2);
    if (!user) {
      throw new Error("User not found");
    }

    const person = formatData(user.Person);
    const format = [
      {
        ...user,
        Person: { ...person, id: undefined },
        UserType: user.UserType?.type,
        token: accToken,
      },
    ];

    req.custom = { ...req.custom, users: format };
    next();
  } catch (error) {
    error.status = 401;
    return responseFailed({ res, error, message: error.message });
  }
};

export const databases = {
  verifyAuth,
};
