import { passwordResetRequest } from "./passwordResetRequest.js";
import { passwordResetSuccess } from "./passwordResetSuccess.js";

export const passwords = {
  reset: {
    request: passwordResetRequest,
    success: passwordResetSuccess,
  },
};
