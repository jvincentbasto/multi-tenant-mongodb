import { nextApiHandlers } from "@/dbs/nextApi/main.js";
import { services } from "../services/main/main.js";
import { mongoNativeDb } from "../main/db/main.js";
import { handlers } from "./handlers.js";

const names = {
  type: "Middleware",
  group: "Auth(Master)",
};
const collectionNames = {
  persons: "persons",
  userTypes: "userTypes",
  users: "users",
  sessions: "sessions",
};
const messageList = [names.type, names.group];

//
const { response } = await nextApiHandlers.getMainVersion();
const { response: apiResponse } = response.default;

//
// const responseSuccess = apiResponse.success;
const responseReject = apiResponse.reject;

//
const getCollection = ({ client, name }) => {
  return client && name ? client.collection(name) : null;
};

// handlers
const generateMiddlware = handlers.method;
// const getParams = handlers.getParams;
const formatData = handlers.formatData;

//
const clientDb = mongoNativeDb.multiple;
const { jwt } = services;
const { accessToken, refreshToken } = jwt.handlers;

// middlewares
const middlewares = {
  verifyAuth: async (req, context) => {
    const { params = {} } = context;
    let { region, env, db } = await params;

    const client = await clientDb.connect({ region, env, db });

    // verify access token
    const accToken = await accessToken.getToken({ req });
    const decodedAccToken = await accessToken.verifyToken({
      token: accToken,
    });
    if (!decodedAccToken) {
      throw new Error("Unauthorized, no token provided");
    }

    // verify refresh token
    const refToken = await refreshToken.getCookie({ req, region, env });
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

    const collectionList = [
      collectionNames.sessions,
      collectionNames.users,
      collectionNames.persons,
      collectionNames.userTypes,
    ];
    const [Model1, Model2, Model3, Model4] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2 || !Model3 || !Model4) {
      throw new Error("Model is required");
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
    const formattedData = [
      {
        ...user,
        Person: { ...person, id: undefined },
        UserType: user.UserType?.type,
        token: accToken,
      },
    ];

    const custom = { users: formattedData };
    const newContext = { ...context, custom };
    return { req, context: newContext };
  },
};

// map resource
const mapResource = () => {
  const construct = (messages = [], name, bulk = false) => {
    const currentMessage = [...messageList, ...messages];
    const fn = middlewares[name] ?? responseReject({}, {}, { response: true });

    const values = { main: true, messages: currentMessage, fn, bulk };
    return values;
  };
  const map = {
    verifyAuth: { messages: ["verify(Auth)"] },
  };

  const mapped = {};
  for (const [key, value] of Object.entries(map)) {
    const { messages, bulk } = value;
    mapped[key] = construct(messages, key, bulk);
  }

  return mapped;
};

// middlewares
const mapped = mapResource();
const payloadMethods = [{ map: mapped }];
export const auth = generateMiddlware(...payloadMethods);
