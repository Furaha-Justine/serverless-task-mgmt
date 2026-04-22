// lambdas/preSignup/index.js
// Cognito Pre-Signup trigger: blocks non-approved email domains

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || "").split(",").map(d => d.trim().toLowerCase());

exports.handler = async (event) => {
  const email = (event.request.userAttributes.email || "").toLowerCase();
  const domain = email.split("@")[1];

  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    throw new Error(`SignUp restricted to: ${ALLOWED_DOMAINS.join(", ")}`);
  }

  // Allow signup - Cognito will still require email verification before login
  return event;
};
