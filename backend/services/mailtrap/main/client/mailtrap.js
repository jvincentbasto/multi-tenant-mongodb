import { MailtrapClient } from "mailtrap";
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

const { sandbox: sandboxEnvs, accountId } = config.envs;

// sandbox
const sandboxToken = sandboxEnvs.token;
const sandboxUser = sandboxEnvs.user;
const sandboxPassword = sandboxEnvs.password;

// prod
const prodToken = config.envs.prod.token;

// clients
const clientSandboxSdk = new MailtrapClient({
  token: sandboxToken,
  testInboxId: 3161246,
  accountId,
});
const clientSandboxSmtp = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: sandboxUser,
    pass: sandboxPassword,
  },
});
const clientProdSmtp = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "smtp@mailtrap.io",
    pass: prodToken,
  },
});

// send methods
const sandboxSdk = async (payload = {}, params = {}, options = {}) => {
  try {
    // not working
    const client = clientSandboxSdk;

    const sendPayload = { ...defaultParams.sdk, sandbox: true, ...payload };
    client.send(sendPayload);
  } catch (error) {
    throw new Error(`Mailtrap client (Sandbox SDK) error - ${error}`);
  }
};
const sandboxSmtp = async (payload = {}, params = {}, options = {}) => {
  try {
    const transport = clientSandboxSmtp;

    const sendPayload = {
      ...defaultParams.smtp,
      sandbox: true,
      ...payload,
    };
    await transport.sendMail(sendPayload);
  } catch (error) {
    throw new Error(`Mailtrap client (Sandbox SMTP) error - ${error}`);
  }
};
const prodSmtp = async (payload = {}, params = {}, options = {}) => {
  try {
    const transport = clientProdSmtp;

    const sendPayload = {
      ...defaultParams.smtp,
      ...payload,
    };
    await transport.sendMail(sendPayload);
  } catch (error) {
    throw new Error(`Mailtrap client (Sandbox SMTP) error - ${error}`);
  }
};

export const mailtrap = {
  sandbox: {
    client: {
      sdk: clientSandboxSdk,
      smtp: clientSandboxSmtp,
    },
    send: {
      sdk: sandboxSdk,
      smtp: sandboxSmtp,
    },
  },
  prod: {
    client: {
      smtp: clientProdSmtp,
    },
    send: {
      smtp: prodSmtp,
    },
  },
};
