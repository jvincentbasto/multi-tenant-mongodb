import dotenv from "dotenv";

//
dotenv.config();
const processEnv = process.env;

//
const accountId = processEnv.MAILTRAP_ACCOUNT_ID;

// sandbox
const sandbox = {
  token: processEnv.MAILTRAP_SANDBOX_TOKEN,
  user: processEnv.MAILTRAP_SANDBOX_USER,
  password: processEnv.MAILTRAP_SANDBOX_PASSWORD,
};

const prod = {
  token: processEnv.MAILTRAP_PROD_TOKEN,
};

// google
const google = {
  appPassword: {
    user: processEnv.MAILTRAP_SANDBOX_GOOGLE_USER,
    password: processEnv.MAILTRAP_SANDBOX_GOOGLE_APPS_PASSWORD,
  },
  oauth: {
    email: processEnv.MAILTRAP_OAUTH_GOOGLE_EMAIL,
    clientId: processEnv.MAILTRAP_OAUTH_GOOGLE_CLIENT_ID,
    clientSecret: processEnv.MAILTRAP_OAUTH_GOOGLE_CLIENT_SECRET,
    redirectUri: processEnv.MAILTRAP_OAUTH_GOOGLE_REDIRECT_URI,
    refreshToken: processEnv.MAILTRAP_OAUTH_GOOGLE_REFRESH_TOKEN,
  },
};

// constants
const env = {
  mailtrap: "mailtrap",
  google: "google",
  prod: "prod",
};
const mode = {
  smtp: "smtp",
  sdk: "sdk",
  appPassword: "appPassword",
  oauth: "oauth",
};
const constants = {
  env,
  mode,
};

const defaults = {
  env: constants.env.mailtrap,
  mode: constants.mode.smtp,
};

// envs
const envs = {
  accountId,
  sandbox,
  prod,
  google,
};

export const config = {
  envs,
  constants,
  defaults,
};
