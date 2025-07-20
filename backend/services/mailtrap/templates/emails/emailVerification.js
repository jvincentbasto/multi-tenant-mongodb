const company = "The Unibase";

const styles = {
  body: "font-family: Arial, sans-serif; font-size: 14; line-height: 1; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;",
  sections: "margin: 0; margin-bottom: 20px; font-size: 14px;",
  line: "margin: 0; margin-bottom: 8px;",
  header:
    "background: linear-gradient(to right, #4CAF50, #45a049); padding: 25px 20px; padding-bottom: 16px; text-align: center;",
  footer:
    "margin: 20px 0; font-weight: bold; font-size: 13px; color: darkslategray;",
};

export const emailVerification = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="${styles.body}">
  <div style="${styles.header}">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <div style="${styles.sections} margin-top: 20px">  
      <p style="${styles.line}">Hello,</p>
      <p style="${styles.line}">Thank you for signing up!</p>
      <p style="${styles.line}">Your verification code is:</p>
    </div>
    <div style="${styles.sections} text-align: center; margin-bottom: 40px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <div style="${styles.sections} margin-bottom: 60px;">
      <p style="${styles.line}">Enter this code on the verification page to complete your registration.</p>
      <p style="${styles.line}">This code will expire in 15 minutes for security reasons.</p>
      <p style="${styles.line}">If you didn't create an account with us, please ignore this email.</p>
    </div>
    <div style="${styles.footer} margin-bottom: 20px">
      <p style="${styles.line}">Best regards,</p>
      <p style="${styles.line}">${company}</p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
