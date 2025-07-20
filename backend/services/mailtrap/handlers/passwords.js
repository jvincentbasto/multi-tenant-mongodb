import { clients } from "../main/client/main.js";
import { templates } from "../templates/main/main.js";

const { getSender, format } = clients;
const { passwords: passwordTemplates } = templates;

const prepareTemplate = format.prepareTemplate;
const formatPayload = format.formatPayload;

const resetRequest = async (payload = {}, params = {}, options = {}) => {
  try {
    const { to = [] } = payload;
    const { body = {}, templates = {} } = payload;
    // const { uuid, variables } = templates

    const template = passwordTemplates.reset.request;
    const html = prepareTemplate(template, body);

    const payloadSend = {
      to,
      html,
      ...templates,
      subject: "Password Reset Request",
      category: "Password Reset",
    };
    const format = formatPayload(payloadSend);

    const send = getSender();
    await send(format);
  } catch (error) {
    throw new Error(`Password reset email error - ${error}`);
  }
};
const resetSuccess = async (payload = {}, params = {}, options = {}) => {
  try {
    const { to = [] } = payload;
    const { body = {}, templates = {} } = payload;
    // const { uuid, variables } = templates

    const template = passwordTemplates.reset.request;
    const html = prepareTemplate(template, body);

    const payloadSend = {
      to,
      html,
      ...templates,
      subject: "Password Reset Successful",
      category: "Password Reset",
    };
    const format = formatPayload(payloadSend);

    const send = getSender();
    await send(format);
  } catch (error) {
    throw new Error(`Password reset email error - ${error}`);
  }
};

export const passwords = {
  reset: {
    request: resetRequest,
    success: resetSuccess,
  },
};
