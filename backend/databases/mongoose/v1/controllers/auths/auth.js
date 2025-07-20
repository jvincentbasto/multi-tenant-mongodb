import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { services } from "../../../../../services/main/main.js";
import { handlers } from "../handlers.js";

// context
const { responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: { dynamic: true } },
  params: { enable: {}, bulk: { model: true } },
};

// services
const { jwt, mailtrap } = services;
const { accessToken, refreshToken } = jwt.handlers;
const { emails: emailHandlers, passwords: passwordHandlers } =
  mailtrap.handlers;

//
const collectionNames = {
  sessions: "sessions",
  users: "users",
  persons: "persons",
  userTypes: "userTypes",
  emailVerificationTokens: "emailVerificationTokens",
  otpTokens: "otpTokens",
};

// auth handlers
const authHandlers = {
  // verify
  verifySession: async (payload = {}) => {
    const { req, res, ctx, Model1, Model2, email } = payload;
    const { params = {} } = ctx;
    let { region, env } = params;

    if (!Model1 || !Model2) {
      throw new Error("Model is required");
    }

    // verify access token
    const accToken = await accessToken.getToken({ req, res });
    const decodedAccess =
      (await accessToken.verifyToken({
        token: accToken,
      })) ?? {};

    // verify refresh token
    const refToken = await refreshToken.getCookie({ req, res, region, env });
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

    // user
    const user = email
      ? await Model1.findOne({
          email,
        })
      : null;
    const userFormat = formatData(user);

    // sessions
    const hasToken = decodedRefresh.token ?? null;
    const hasSessionParams = user && hasToken;
    const sessionOld = hasSessionParams
      ? await Model2.findOne({
          User: user._id,
          oldToken: decodedRefresh.token,
        })
      : null;
    const sessionCurrent = hasSessionParams
      ? await Model2.findOne({
          User: user._id,
          token: decodedRefresh.token,
        })
      : null;
    const sessions = {
      hasToken,
      hasSessionParams,
      user: userFormat,
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
  verifyUser: async (payload = {}) => {
    const { req, res, ctx, models = {}, payload: payloadUser = {} } = payload;
    const { Model1: User, Model2: Session } = models;

    const payloadVerify = {
      req,
      res,
      ctx,
      Model1: User,
      Model2: Session,
      email,
    };
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
  verifyTokens: async (payload = {}) => {
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
  generateTokens: async (payload = {}) => {
    const { req, res, ctx, Model, payload: payloadSession = {} } = payload;
    const { params } = ctx;
    let { region, env } = params;

    // generate jti
    const jti = await accessToken.generateJti();

    // generate access token
    const payloadAccToken = { body: { id: jti } };
    const newAccToken = await accessToken.generateToken(payloadAccToken);

    // set refresh token
    const refId = await refreshToken.generateId();
    const payloadRefToken = { body: { id: jti, token: refId } };
    const newRefToken = await refreshToken.generateToken(payloadRefToken);
    await refreshToken.setCookie({ req, res, region, env, token: newRefToken });

    // create session
    const { userAgent, ip } = await refreshToken.getSessionInfo({ req, res });
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
    const session = await Model.create(payload2);

    const sessionData = {
      jti,
      accessToken: newAccToken,
      refreshToken: newRefToken,
      session: session,
    };
    return sessionData;
  },
  generateEmailVerificationToken: async (payload = {}) => {
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
const signup = async (req, res) => {
  try {
    const models = [
      collectionNames.users,
      collectionNames.persons,
      collectionNames.userTypes,
      collectionNames.emailVerificationTokens,
    ];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, Models } = ctx;
    const { email, password, ...rest } = body;
    const [Model1, Model2, Model3, Model4] = Models;

    if (!email || !password) {
      throw new Error("All fields are required");
    }
    const { firstName, lastName } = rest;
    if (!firstName || !lastName) {
      throw new Error("First and last name is required");
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
    const results1 = await Model1.create(payload1);
    const user = formatData(results1);

    // email verification token
    const payloadToken = { Model: Model4, user, email: user.email };
    await authHandlers.generateEmailVerificationToken(payloadToken);

    const format = [
      {
        ...user,
        Person: { ...person, id: undefined },
        UserType: [userType?.type],
      },
    ];

    const message = "Successfully signed-up";
    const payloadData = { res, data: format, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const login = async (req, res) => {
  try {
    const models = [
      collectionNames.users,
      collectionNames.sessions,
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

    const { body, Models } = ctx;
    const { email, password } = body;
    const [Model1, Model2, Model3, Model4] = Models;

    if (!email || !password) {
      throw new Error("All fields are required");
    }

    const match1 = await Model1.findOne({ email })
      .populate([
        { path: "Person", model: Model3 },
        { path: "UserType", model: Model4 },
      ])
      .lean();
    const user = formatData({ ...match1, password: undefined });
    if (!user) {
      throw new Error("User does not exist");
    }

    const passwordMatch = await bcryptjs.compare(password, match1.password);
    if (!passwordMatch) {
      throw new Error("Invalid credentials");
    }

    const payloadVerify = { req, res, ctx, Model1, Model2, email };
    const { tokens, jtis, sessions, expiries } =
      await authHandlers.verifySession(payloadVerify);

    //
    const { accessToken: accToken } = tokens;
    const { matchedJti } = jtis;
    const { sessionOld, sessionCurrent } = sessions;
    const { expiredSessionCurrent } = expiries;

    // verify old session
    if (sessionOld) {
      await Model2.deleteOne({ _id: sessionOld._id });
      // email
    }

    const getLoginData = async (payload = {}) => {
      const payloadSession = { User: user.id };
      const payloadToken = {
        req,
        res,
        ctx,
        Model: Model2,
        payload: payloadSession,
      };
      const { accessToken: newAccToken } = await authHandlers.generateTokens(
        payloadToken
      );

      // person
      const person = formatData(user?.Person);
      const loginData = {
        ...user,
        Person: { ...person, id: undefined },
        UserType: user.UserType.map((m) => m?.type),
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

    const format = [loginData];
    const message = loginMessage;
    const payloadData = { res, data: format, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const logout = async (req, res) => {
  try {
    const models = [collectionNames.sessions];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { params, Models } = ctx;
    const { region, env } = params;
    const [Model1] = Models;

    // get refresh token
    const refToken = await refreshToken.getCookie({ req, res, region, env });
    const decoded = await refreshToken.verifyToken({ token: refToken });
    if (!decoded) {
      throw new Error("Unauthorized, no token provided");
    }

    // delete refresh token
    await Model1.deleteOne({ token: decoded.token });
    await refreshToken.clearCookie({ req, res, region, env });

    const message = "Successfully logged-out";
    const payloadData = { res, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const refreshTokenHandler = async (req, res) => {
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

    // get current refresh token
    const refToken = await refreshToken.getCookie({ req, res, region, env });
    const decodedRefToken = await refreshToken.verifyToken({
      token: refToken,
    });
    if (!decodedRefToken) {
      const error = new Error("Unauthorized, no token provided");
      error.status = 401;
      throw error;
    }

    // get session
    const results1 = await Model1.findOne({ token: decodedRefToken.token });
    const session = formatData(results1);
    const sessionInfos = [session.ip, session.userAgent];
    const hasSessionInfo = sessionInfos.every((item) => item);

    // match session ip | userAgent
    const refSessionInfo = await refreshToken.getSessionInfo({ req, res });
    const matchIp = session.ip !== refSessionInfo.ip;
    const matchUserAgent = session.userAgent !== refSessionInfo.userAgent;

    if (!hasSessionInfo || matchIp || matchUserAgent) {
      await Model1.deleteOne({ _id: session.id });
      const error = new Error("Session mismatch");
      error.status = 401;
      throw error;
    }

    // verify reused session
    if (!session) {
      const reused = await Model1.findOne({
        oldToken: decodedRefToken.token,
      });
      const reusedSession = formatData(reused);

      if (reusedSession) {
        await Model1.deleteOne({ _id: reusedSession.id });
        const error = new Error("Session reused");
        error.status = 401;
        throw error;
        // send email (creds: session, ip, userAgent)
        // logout current or logout all
      }
    }

    // delete expired session
    if (session.expiresAt < new Date()) {
      await Model1.deleteOne({ _id: session.id });
      const error = new Error("Session expired, please login again");
      error.status = 401;
      throw error;
    }

    const payloadSession = {
      User: session.User,
      oldToken: decodedRefToken.token,
    };
    const payloadToken = {
      req,
      res,
      ctx,
      Model: Model1,
      payload: payloadSession,
    };
    const { accessToken: newAccToken } = await authHandlers.generateTokens(
      payloadToken
    );

    // delete old session
    await Model1.deleteOne({ _id: session.id });

    let curData = { token: newAccToken };
    const includeUser = req.headers["cflag-include-user"] === "true";
    if (includeUser) {
      const match1 = await Model2.findOne({ _id: session.User })
        .populate([
          { path: "Person", model: Model3 },
          { path: "UserType", model: Model4 },
        ])
        .lean();
      const user = formatData({ ...match1, password: undefined });

      const person = formatData(user?.Person);
      const userData = {
        ...user,
        Person: { ...person, id: undefined },
        UserType: user.UserType.map((m) => m?.type),
        token: newAccToken,
      };
      curData = userData;
    }

    const format = [{ ...curData }];
    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    // error.status = 401
    return responseFailed({ res, error, message: error.message });
  }
};

// email
const requestEmailVerification = async (req, res) => {
  try {
    const models = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.emailVerificationTokens,
    ];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, Models } = ctx;
    const { email } = body;
    const [Model1, Model2, Model3] = Models;

    if (!email) {
      throw new Error("Email is required");
    }

    // verify user
    const payloadUser = { email };
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      req,
      res,
      ctx,
      models: payloadModels,
      payload: payloadUser,
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
    const payloadData = { res, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const verifyEmail = async (req, res) => {
  try {
    const models = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.emailVerificationTokens,
    ];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, Models } = ctx;
    const { email, code } = body;
    const [Model1, Model2, Model3] = Models;

    if (!email) {
      throw new Error("Email is required");
    }
    if (!code) {
      throw new Error("Verification code is required");
    }

    // verify user
    const payloadUser = { email };
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      req,
      res,
      ctx,
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
    const payloadData = { res, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// password
const forgotPassword = async (req, res) => {
  try {
    const models = [collectionNames.users, collectionNames.otpTokens];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, Models } = ctx;
    const { email } = body;
    const [Model1, Model2] = Models;

    if (!email) {
      throw new Error("Email is required");
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
    const match2 = await Model2.create(payload2);
    if (!match2) {
      throw new Error("Token was not created");
    }

    const sendPayload = { to: [{ email }], body: { token: resetToken } };
    const sendHandler = passwordHandlers.reset.request;
    await sendHandler(sendPayload);

    const message = "OTP has been sent to your email";
    const payloadData = { res, message };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const resetPassword = async (req, res) => {
  try {
    const models = [
      collectionNames.users,
      collectionNames.sessions,
      collectionNames.otpTokens,
    ];

    const payloadContext = {
      req,
      ...ctxArgs.payload,
      model: { ...ctxArgs.payload.model, models },
    };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);

    const { body, Models } = ctx;
    const { email, code, password, confirmPassword } = body;
    const [Model1, Model2, Model3] = Models;

    if (!email) {
      throw new Error("Email is required");
    }
    if (!code) {
      throw new Error("Code is required");
    }
    if (!password || !confirmPassword) {
      throw new Error("Unmatched passwords");
    }

    // verify user
    const payloadUser = { email };
    const payloadModels = { Model1, Model2 };
    const payloadVerifyUser = {
      req,
      res,
      ctx,
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

    const sendPayload = {
      to: [{ email }],
      body: { email, name: match1.name },
    };
    const sendHandler = passwordHandlers.reset.success;
    await sendHandler(sendPayload);
    const payloadData = { res };

    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const auth = {
  signup,
  login,
  logout,
  refreshTokenHandler,
  //
  requestEmailVerification,
  verifyEmail,
  //
  forgotPassword,
  resetPassword,
};
