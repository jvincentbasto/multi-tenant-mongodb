import { ObjectId } from "mongodb";

import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { nextApiHandlers } from "@/dbs/nextApi/main.js";
import { services } from "../../services/main/main.js";

import { handlers } from "../handlers.js";

//
const names = {
  type: "Method",
  group: "Auth",
};
const messageList = [names.type, names.group];

//
const { response } = await nextApiHandlers.getMainVersion();
const { response: apiResponse } = response.default;
const { handlers: apiHandlers, constants: apiConstants } = apiResponse;

//
// const bulkResponse = apiConstants.response.bulk;
const responseSuccess = apiHandlers.success;
// const responseReject = apiHandlers.reject;

//
const getCollection = ({ client, name }) => {
  return client && name ? client.collection(name) : null;
};

// handlers
const generateMethods = handlers.method;
const getParams = handlers.getParams;
const formatData = (data = {}, options = {}) => {
  const { enableToObject = true } = options;

  if (!data) return null;

  let currentData = data ?? {};
  if (enableToObject) {
    currentData = typeof data?.toObject === "function" ? data.toObject() : data;
  }

  const { _id, __v, password, ...rest } = currentData;
  const formattedDocs = {
    id: _id,
    ...rest,
  };

  return formattedDocs;
};

//
const { jwt, mailtrap } = services;
const { accessToken, refreshToken } = jwt.handlers;
const { emails: emailHandlers, passwords: passwordHandlers } =
  mailtrap.handlers;

//
const collectionNames = {
  persons: "persons",
  userTypes: "userTypes",
  users: "users",
  sessions: "sessions",
  emailVerificationTokens: "emailVerificationTokens",
  otpTokens: "otpTokens",
};

// auth handlers
const authHandlers = {
  verifySession: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, Model } = payload;
    const { req, params: apiParams = {} } = api.all;
    let { region, env } = apiParams;

    if (!Model) {
      throw new Error("Model is required");
    }

    // verify access token
    const accToken = await accessToken.getToken({ req });
    const decodedAccess =
      (await accessToken.verifyToken({
        token: accToken,
      })) ?? {};

    // verify refresh token
    const refToken = await refreshToken.getCookie({ req, region, env });
    const decodedRefresh =
      (await refreshToken.verifyToken({
        token: refToken,
      })) ?? {};

    const tokens = {
      accessToken: accToken,
      refreshToken: refToken,
      decodedAccess,
      decodedRefresh,
    };

    // match jti
    const accessJti = decodedAccess?.id ?? null;
    const refreshJti = decodedRefresh?.id ?? null;
    const hasEmptyJti = [accessJti, refreshJti].some((item) => !item);
    const matchedJti = !hasEmptyJti && accessJti === refreshJti;
    const jtis = {
      accessJti,
      refreshJti,
      hasEmptyJti,
      matchedJti,
    };

    // sessions
    const sessionOld = await Model.findOne({
      oldToken: decodedRefresh.token,
    });
    const sessionCurrent = await Model.findOne({
      token: decodedRefresh.token,
    });
    const sessions = {
      sessionOld,
      sessionCurrent,
    };

    // expiry
    const newDate = new Date();
    const expiredSessionOld = sessionOld?.expiresAt < newDate ?? null;
    const expiredSessionCurrent = sessionCurrent?.expiresAt < newDate ?? null;
    const expiries = {
      expiredSessionOld,
      expiredSessionCurrent,
    };

    const sessionData = {
      tokens,
      jtis,
      sessions,
      expiries,
    };
    return sessionData;
  },
  verifyUser: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, models = {}, payload: payloadUser = {} } = payload;
    const { Model1: User, Model2: Session } = models;

    const payloadVerify = { api, Model: Session };
    const { sessions, expiries } = await authHandlers.verifySession(
      payloadVerify
    );
    const { sessionCurrent } = sessions;
    const { expiredSessionCurrent } = expiries;

    let user;
    if (sessionCurrent) {
      if (expiredSessionCurrent) {
        await Session.deleteOne({ _id: sessionCurrent._id });
        throw new Error("Session expired, please login again");
      }

      const payload1 = { _id: sessionCurrent.User };
      const match1 = await User.findOne(payload1);
      if (match1) user = formatData(match1);
    } else {
      const payload1 = { ...payloadUser };
      const match1 = await User.findOne(payload1);
      if (match1) user = formatData(match1);
    }

    const userData = { user };
    return userData;
  },
  verifyTokens: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { Model, user, payload: payloadToken = {} } = payload;
    let token;

    // verify token
    const payload1 = { User: user.id, ...payloadToken };
    const match1 = await Model.findOne(payload1);
    if (match1) token = formatData(match1);
    if (!match1) {
      throw new Error("No Token found");
    }

    const expiredEmailToken = token.expiresAt <= new Date();
    const usedEmailToken = token.used;
    if (expiredEmailToken) {
      await Model.deleteOne({ _id: token.id });
      throw new Error("Expired Token");
    }
    if (usedEmailToken) {
      await Model.deleteOne({ _id: token.id });
      throw new Error("Token has already been used");
    }

    const tokenData = { token };
    return tokenData;
  },

  // generate
  generateTokens: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, Model, payload: payloadSession = {} } = payload;
    const { req, params: apiParams = {} } = api.all;
    let { region, env } = apiParams;

    // generate jti
    const jti = await accessToken.generateJti();

    // generate access token
    const payloadAccToken = { body: { id: jti } };
    const newAccToken = await accessToken.generateToken(payloadAccToken);

    // set refresh token
    const refId = await refreshToken.generateId();
    const payloadRefToken = { body: { id: jti, token: refId } };
    const newRefToken = await refreshToken.generateToken(payloadRefToken);
    await refreshToken.setCookie({ req, region, env, token: newRefToken });

    // create session
    const { userAgent, ip } = await refreshToken.getSessionInfo({ req });
    const now = Date.now();
    const expiresAt = now + refreshToken.config.maxAge;
    const payload2 = {
      token: refId,
      accessJti: jti,
      userAgent,
      ip,
      createdAt: now,
      expiresAt,
      ...payloadSession,
    };
    const session = await Model.insertOne(payload2);

    const sessionData = {
      jti,
      accessToken: newAccToken,
      refreshToken: newRefToken,
      session: session,
    };
    return sessionData;
  },
  generateEmailVerificationToken: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { Model, user, email } = payload;
    let token;

    // email verification token
    const randomToken = Math.floor(100000 + Math.random() * 900000);
    const emailToken = randomToken.toString();
    const hashedToken = crypto
      .createHash("sha256")
      .update(emailToken)
      .digest("hex");
    const emailTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    //
    const payload1 = {
      User: user.id,
      email: email,
      token: emailToken,
      hashed: hashedToken,
      expiresAt: emailTokenExpiresAt,
    };
    const match1 = await Model.create(payload1);
    if (match1) token = formatData(match1);
    if (!match1) {
      throw new Error("Email verification token was not created");
    }

    const sendPayload = {
      to: [{ email: user.email }],
      body: { verificationCode: emailToken },
    };
    const sendHandler = emailHandlers.verification;
    await sendHandler(sendPayload);

    const tokenData = { token };
    return tokenData;
  },
};

// main
const methods = {
  signup: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { body } = api.all;
    const { email, password, ...rest } = body;

    if (!email || !password) {
      throw new Error("All fields are required");
    }
    const { firstName, lastName } = rest;
    if (!firstName || !lastName) {
      throw new Error("First and last name is required");
    }

    const collectionList = [
      collectionNames.users,
      collectionNames.persons,
      collectionNames.userTypes,
      collectionNames.emailVerificationTokens,
    ];
    const [Model1, Model2, Model3, Model4] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if ((!Model1 || !Model2 || !Model3, !Model4)) {
      throw new Error("Model is required");
    }

    const match = await Model1.findOne({ email });
    if (match) {
      throw new Error("User already exists");
    }

    // userType
    const results3 = await Model3.findOne({ type: 0 });
    const userType = formatData(results3);
    if (!results3) {
      throw new Error("User role does not exist");
    }

    // person
    const payload2 = { ...rest };
    const results2 = await Model2.create(payload2);
    const person = formatData(results2);

    // user
    const hashedPassword = await bcryptjs.hash(password, 10);
    const payload1 = {
      Person: person.id,
      UserType: [userType.id],
      email,
      password: hashedPassword,
    };
    const results1 = await Model1.insertOne(payload1);
    const user = formatData(results1);

    // email verification token
    const payloadToken = { Model: Model4, user, email: user.email };
    await authHandlers.generateEmailVerificationToken(payloadToken);

    const formattedData = [
      {
        ...user,
        Person: { ...person, id: undefined },
        UserType: [userType?.type],
      },
    ];

    const message = "Successfully signed-up";
    const response = responseSuccess({ data: formattedData, message });
    return response;
  },
  login: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { req, body } = api.all;
    const { email, password } = body;

    if (!email || !password) {
      throw new Error("All fields are required");
    }

    const collectionList = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.persons,
      collectionNames.userTypes,
    ];
    const [Model1, Model2, Model3, Model4] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2 || !Model3 || !Model4) {
      throw new Error("Model is required");
    }

    const match1 = await Model1.findOne({ email }).populate([
      { path: "Person", model: Model3 },
      { path: "UserType", model: Model4 },
    ]);
    const user = formatData(match1);
    if (!user) {
      throw new Error("User does not exist");
    }

    const passwordMatch = await bcryptjs.compare(password, match1.password);
    if (!passwordMatch) {
      throw new Error("Invalid credentials");
    }

    const payloadVerify = { api, Model: Model2 };
    const { tokens, jtis, sessions, expiries } =
      await authHandlers.verifySession(payloadVerify);
    const { accessToken: accToken } = tokens;
    const { matchedJti } = jtis;
    const { sessionOld, sessionCurrent } = sessions;
    const { expiredSessionCurrent } = expiries;

    // verify old session
    if (sessionOld) {
      await Model2.deleteOne({ _id: sessionOld._id });
      // email
    }

    const getLoginData = async (...args) => {
      const [payload, params, options] = getParams(args);

      const payloadSession = { User: user.id };
      const payloadToken = { api, Model: Model2, payload: payloadSession };
      const { accessToken: newAccToken } = await authHandlers.generateTokens(
        payloadToken
      );

      // person
      const person = formatData(user?.Person);
      const loginData = {
        ...user,
        Person: { ...person, id: undefined },
        UserType: [user.UserType?.type],
        token: newAccToken,
      };

      return loginData;
    };

    let loginData = {};
    let loginMessage = "Successfully logged-in";

    // match current session
    if (sessionCurrent) {
      // delete expired session
      if (expiredSessionCurrent) {
        await Model2.deleteOne({ _id: sessionCurrent._id });
        throw new Error("Session expired, please login again");
      }

      // match tokens
      if (matchedJti) {
        // person
        const person = formatData(user?.Person);
        loginData = {
          ...user,
          Person: { ...person, id: undefined },
          UserType: [user.UserType?.type],
          token: accToken,
        };

        loginMessage = "Already logged-in";
      } else {
        // delete current session
        await Model2.deleteOne({ _id: sessionCurrent._id });

        // create new session
        loginData = await getLoginData();
      }
    } else {
      loginData = await getLoginData();
    }

    const formattedData = [loginData];

    const message = loginMessage;
    const response = responseSuccess({ data: formattedData, message });
    return response;
  },
  logout: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    const { req, params: apiParams = {} } = api.all;
    let { region, env } = apiParams;

    const collectionList = [collectionNames.sessions];
    const [Model1] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1) {
      throw new Error("Model is required");
    }

    // get refresh token
    const refToken = await refreshToken.getCookie({ req, region, env });
    const decoded = await refreshToken.verifyToken({ token: refToken });
    if (!decoded) {
      throw new Error("Unauthorized, no token provided");
    }

    // delete refresh token
    await Model1.deleteOne({ token: decoded.token });
    await refreshToken.clearCookie({ req, region, env });

    const message = "Successfully logged-out";
    const response = responseSuccess({ message });
    return response;
  },
  refreshToken: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;
    const { req, params: apiParams = {} } = api.all;
    let { region, env } = apiParams;

    const collectionList = [collectionNames.sessions];
    const [Model1] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1) {
      throw new Error("Model is required");
    }

    // get current refresh token
    const refToken = await refreshToken.getCookie({ req, region, env });
    const decodedRefToken = await refreshToken.verifyToken({
      token: refToken,
    });
    if (!decodedRefToken) {
      throw new Error("Unauthorized, no token provided");
    }

    // get session
    const results1 = await Model1.findOne({ token: decodedRefToken.token });
    const session = formatData(results1);
    const sessionInfos = [session.ip, session.userAgent];
    const hasSessionInfo = sessionInfos.every((item) => item);

    // match session ip | userAgent
    const refSessionInfo = await refreshToken.getSessionInfo({ req });
    const matchIp = session.ip !== refSessionInfo.ip;
    const matchUserAgent = session.userAgent !== refSessionInfo.userAgent;

    if (!hasSessionInfo || matchIp || matchUserAgent) {
      await Model1.deleteOne({ _id: session.id });
      throw new Error("Session mismatch");
    }

    // verify reused session
    if (!session) {
      const reused = await Model1.findOne({
        oldToken: decodedRefToken.token,
      });
      const reusedSession = formatData(reused);

      if (reusedSession) {
        await Model1.deleteOne({ _id: reusedSession.id });
        throw new Error("Session reused");
        // send email (creds: session, ip, userAgent)
        // logout current or logout all
      }
    }

    // delete expired session
    if (session.expiresAt < new Date()) {
      await Model1.deleteOne({ _id: session.id });
      throw new Error("Session expired, please login again");
    }

    const payloadSession = {
      User: session.User,
      oldToken: decodedRefToken.token,
    };
    const payloadToken = { api, Model: Model1, payload: payloadSession };
    const { accessToken: newAccToken } = await authHandlers.generateTokens(
      payloadToken
    );

    // delete old session
    await Model1.deleteOne({ _id: session.id });

    const formattedData = [{ token: newAccToken }];

    const response = responseSuccess({ data: formattedData });
    return response;
  },

  // email
  requestEmailVerification: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { req, body } = api.all;
    const { email } = body;

    if (!email) {
      throw new Error("Email is required");
    }

    const collectionList = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.emailVerificationTokens,
    ];
    const [Model1, Model2, Model3] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2 || !Model3) {
      throw new Error("Model is required");
    }

    // verify user
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      api,
      models: payloadModels,
    };
    const { user } = await authHandlers.verifyUser(payloadVerifyUser);
    if (!user) {
      throw new Error("User does not exist");
    }

    const payload3 = { User: user.id, email: email };
    const match3 = await Model3.findOne(payload3);
    if (match3) {
      await Model3.deleteOne({ _id: match3._id });
    }

    const payloadToken = { Model: Model3, user, email };
    await authHandlers.generateEmailVerificationToken(payloadToken);

    const message = "Requested Email Verification";
    const response = responseSuccess({ message });
    return response;
  },
  verifyEmail: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { req, body } = api.all;
    const { email, code } = body;

    if (!email) {
      throw new Error("Email is required");
    }
    if (!code) {
      throw new Error("Verification code is required");
    }

    const collectionList = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.emailVerificationTokens,
    ];
    const [Model1, Model2, Model3] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2 || !Model3) {
      throw new Error("Model is required");
    }

    // verify user
    const payloadUser = { email };
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      api,
      models: payloadModels,
      payload: payloadUser,
    };
    const { user } = await authHandlers.verifyUser(payloadVerifyUser);
    if (!user) {
      throw new Error("User does not exist");
    }

    const emailConfirmed = user.emailConfirmed;
    if (emailConfirmed) {
      throw new Error("Email has already been confirmed");
    }

    // verify token
    const payloadToken = { token: code };
    const payloadVerifyToken = {
      Model: Model3,
      user,
      payload: payloadToken,
    };
    const { token: tokenData } = await authHandlers.verifyTokens(
      payloadVerifyToken
    );
    if (!tokenData) {
      throw new Error("No Token found");
    }

    const payload1 = { emailConfirmed: true };
    const match1 = await Model1.findByIdAndUpdate(user.id, payload1, {
      new: true,
      runValidators: true,
    });
    if (!match1) {
      throw new Error("User was not updated");
    }

    const payload3 = { used: true };
    const match3 = await Model3.findByIdAndUpdate(tokenData.id, payload3, {
      new: true,
      runValidators: true,
    });
    if (!match3) {
      throw new Error("Token was not updated");
    }

    //
    await Model3.deleteOne({ _id: tokenData.id });

    const message = "Email Verified";
    const response = responseSuccess({ message });
    return response;
  },

  // password
  forgotPassword: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { body } = api.all;
    const { email } = body;

    if (!email) {
      throw new Error("Email is required");
    }

    const collectionList = [collectionNames.users, collectionNames.otpTokens];
    const [Model1, Model2] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2) {
      throw new Error("Model is required");
    }

    const match1 = await Model1.findOne({ email });
    const user = formatData(match1);
    if (!match1) {
      throw new Error("User not found");
    }

    const matchVerifyOtp = await Model2.findOne({ User: user.id });
    if (matchVerifyOtp) {
      await Model2.deleteOne({ _id: matchVerifyOtp._id });
    }

    // Generate reset token
    const randomToken = Math.floor(100000 + Math.random() * 900000);
    const resetToken = randomToken.toString();
    //  const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const payload2 = {
      User: user.id,
      token: resetToken,
      hashed: hashedToken,
      expiresAt: resetTokenExpiry,
    };
    const match2 = await Model2.insertOne(payload2);
    if (!match2) {
      throw new Error("Token was not created");
    }

    const sendPayload = { to: [{ email }], body: { token: resetToken } };
    const sendHandler = passwordHandlers.reset.request;
    await sendHandler(sendPayload);

    const message = "OTP has been sent to your email";
    const response = responseSuccess({ message });
    return response;
  },
  resetPassword: async (...args) => {
    const [payload, params, options] = getParams(args);

    const { api, client } = payload;

    const { req, body } = api.all;
    const { email, code, password, confirmPassword } = body;

    if (!email) {
      throw new Error("Email is required");
    }
    if (!code) {
      throw new Error("Code is required");
    }
    if (!password || !confirmPassword) {
      throw new Error("Unmatched passwords");
    }

    const collectionList = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.otpTokens,
    ];
    const [Model1, Model2, Model3] = collectionList.map((name) =>
      getCollection({ name, client })
    );
    if (!Model1 || !Model2 || !Model3) {
      throw new Error("Model is required");
    }

    // verify user
    const payloadUser = { email };
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      api,
      models: payloadModels,
      payload: payloadUser,
    };
    const { user } = await authHandlers.verifyUser(payloadVerifyUser);
    if (!user) {
      throw new Error("User does not exist");
    }

    const userHashedPassword = await bcryptjs.hash(password, 10);
    const payloadHashedPassword = await bcryptjs.hash(password, 10);
    const matchHashedPassword = userHashedPassword === payloadHashedPassword;
    if (matchHashedPassword) {
      throw new Error("Matched old password");
    }

    // verify token
    const payloadToken = { token: code };
    const payloadVerifyToken = {
      Model: Model3,
      user,
      payload: payloadToken,
    };
    const { token: tokenData } = await authHandlers.verifyTokens(
      payloadVerifyToken
    );
    if (!tokenData) {
      throw new Error("No Token found");
    }

    // update password
    const hashedPassword = await bcryptjs.hash(password, 10);
    const payload1 = { password: hashedPassword };
    const match1 = await Model1.updateOne(
      { _id: new ObjectId(user.id) },
      payload1
    );
    if (!match1) {
      throw new Error("User was not updated");
    }

    const payload3 = { used: true };
    const match3 = await Model3.updateOne(
      { _id: new ObjectId(tokenData.id) },
      payload3
    );
    if (!match3) {
      throw new Error("Token was not updated");
    }

    //
    await Model3.deleteOne({ _id: tokenData.id });

    const sendPayload = {
      to: [{ email }],
      body: { email, name: match1.name },
    };
    const sendHandler = passwordHandlers.reset.success;
    await sendHandler(sendPayload);

    const response = responseSuccess({});
    return response;
  },
};

// map resource
const mapResource = () => {
  const construct = (messages = [], name, bulk = false) => {
    const currentMessage = [...messageList, ...messages];
    const fn = methods[name];

    const values = { main: true, messages: currentMessage, fn, bulk };
    return values;
  };
  const map = {
    signup: { messages: ["signup"] },
    login: { messages: ["login"] },
    logout: { messages: ["logout"] },
    refreshToken: { messages: ["refresh(token)"] },
    requestEmailVerification: { messages: ["request(email verification)"] },
    verifyEmail: { messages: ["verify(email)"] },
    forgotPassword: { messages: ["forgot(password)"] },
    resetPassword: { messages: ["reset(password)"] },
  };

  const mapped = {};
  for (const [key, value] of Object.entries(map)) {
    const { messages, bulk } = value;
    mapped[key] = construct(messages, key, bulk);
  }

  return mapped;
};

// methods
const mapped = mapResource();
const payloadMethods = [{ map: mapped }];
export const auth = generateMethods(...payloadMethods);
