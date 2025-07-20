import { config } from "../config.js";
import { googleClients } from "./google.js";
import { mailtrap } from "./mailtrap.js";

const { defaults, constants } = config;
const { env: defaultEnv, mode: defaultMode } = defaults;
const { mode } = constants;

const getSender = () => {
  let send = async () => {};

  const sendSandbox = mailtrap.sandbox.send;
  const sendGoogle = googleClients.send;
  const sendProd = mailtrap.prod.send;

  if (defaultEnv === constants.env.mailtrap) {
    const modeSdk = defaultMode === mode.sdk;
    send = modeSdk ? sendSandbox.sdk : sendSandbox.smtp;
  } else if (defaultEnv === constants.env.google) {
    if (defaultEnv === constants.env.mailtrap) {
      const modeAppPassword = defaultMode === mode.appPassword;
      send = modeAppPassword ? sendGoogle.appPassword : sendGoogle.oauth;
    }
  } else if (defaultEnv === constants.env.prod) {
    send = sendProd.smtp;
  } else {
    send = sendSandbox.smtp;
  }

  return send;
};

// formats
const prepareTemplate = (template, body) => {
  let html = template;

  for (const [key, value] of Object.entries(body)) {
    html = template.replace(`{${key}}`, value);
  }

  return html;
};
const formatPayload = (payload = {}) => {
  const { to = [], from = {}, ...rest } = payload;

  let format = payload;
  if (defaultMode === mode.smtp) {
    format = { ...rest };

    const fromKeys = Object.keys(from);
    const hasFromKeys = ["name", "email"].every((key) =>
      fromKeys.includes(key)
    );
    if (hasFromKeys) {
      const paramFrom = `${from.name} <${from.email}>`;
      format.from = paramFrom;
    }
    if (to.length > 0) {
      const paramTo = to.map((recipient) => `${recipient.email}`).join(", ");
      format.to = paramTo;
    }
  }

  return format;
};
const format = {
  prepareTemplate,
  formatPayload,
};

export const clients = {
  mailtrap,
  google: googleClients,
  getSender,
  format,
};
