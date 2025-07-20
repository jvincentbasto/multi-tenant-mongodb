import { google } from "googleapis";
import nodemailer from "nodemailer";
import { config } from "../config.js";

// default params
const email = "jvincentbasto@gmail.com";
const from = {
  email: "noreply@theunibase.xyz",
  name: "The Unibase",
};
const to = [{ email: email }];
const defaultParams = {
  sdk: { from, to },
  smtp: {
    from: `${from.name} <${from.email}>`,
    to: to.map((recipient) => `${recipient.email}`).join(", "),
  },
};

const { google: googleEnvs } = config.envs;
const { appPassword: appPasswordEnvs, oauth: oauthEnvs } = googleEnvs;

// google's "app password"
const sandboxUser = appPasswordEnvs.user;
const sandboxPassword = appPasswordEnvs.password;

// OAuth2
const googleEmail = oauthEnvs.email;
const googleClientId = oauthEnvs.clientId;
const googleClientSecret = oauthEnvs.clientSecret;
const googleRedirectUri = oauthEnvs.redirectUri;
const googleRefreshToken = oauthEnvs.refreshToken;

// OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  googleRedirectUri
);
oAuth2Client.setCredentials({ refresh_token: googleRefreshToken });

// clients
const clientAppPassword = nodemailer.createTransport({
  service: "gmail",
  port: 2525,
  auth: {
    user: sandboxUser,
    pass: sandboxPassword,
  },
});
const clientOAuth = async () => {
  const accessTokenResponse = await oAuth2Client.getAccessToken();

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: googleEmail,
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken,
      accessToken: accessTokenResponse.token,
    },
  });

  return transport;
};

// send methods
const appPassword = async (payload = {}, params = {}, options = {}) => {
  try {
    const transport = clientAppPassword;

    const sendPayload = {
      ...defaultParams.smtp,
      sandbox: true,
      ...payload,
    };
    transport.sendMail(sendPayload);
  } catch (error) {
    throw new Error(
      `Mailtrap client (AppPassword Google SMTP) error - ${error}`
    );
  }
};
const oauth = async (payload = {}, params = {}, options = {}) => {
  try {
    const transport = await clientOAuth();

    const sendPayload = {
      ...defaultParams.smtp,
      ...payload,
    };
    transport.sendMail(sendPayload);
  } catch (error) {
    throw new Error(`Mailtrap client (OAuth Google SMTP) error - ${error}`);
  }
};

export const googleClients = {
  client: {
    appPassword: clientAppPassword,
    oauth: clientOAuth,
  },
  send: {
    appPassword,
    oauth,
  },
};
