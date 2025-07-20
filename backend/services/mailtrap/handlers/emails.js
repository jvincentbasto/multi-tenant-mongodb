import { clients } from "../main/client/main.js";
import { templates } from "../templates/main/main.js";

const { getSender, format } = clients;
const { emails: emailTemplates } = templates;

const prepareTemplate = format.prepareTemplate;
const formatPayload = format.formatPayload;

const verification = async (payload = {}, params = {}, options = {}) => {
  try {
    const { to = [] } = payload;
    const { body = {}, templates = {} } = payload;
    // const { uuid, variables } = templates

    if (to.length <= 0) {
      throw new Error("Empty Recipients");
    }

    const template = emailTemplates.verification;
    const html = prepareTemplate(template, body);

    const payloadSend = {
      to,
      html,
      ...templates,
      subject: "Verify your email",
      category: "Email Verification",
    };
    const format = formatPayload(payloadSend);

    const send = getSender();
    await send(format);
  } catch (error) {
    throw new Error(`Email verification error - ${error}`);
  }
};
const welcome = async (payload = {}, params = {}, options = {}) => {
  try {
    const { to = [] } = payload;
    const { body = {}, templates = {} } = payload;
    // const { uuid, variables } = templates

    const template = emailTemplates.welcome;
    const html = prepareTemplate(template, body);

    const payloadSend = {
      to,
      html,
      ...templates,
      subject: "Welcome",
      category: "Welcome",
    };

    const send = getSender();
    await send(payloadSend);
  } catch (error) {
    throw new Error(`Welcome email error - ${error}`);
  }
};

export const emails = {
  verification,
  welcome,
};
