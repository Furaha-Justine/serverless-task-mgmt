// Values are injected by Amplify at build time via environment variables.
export const cognitoConfig = {
  region:       import.meta.env.VITE_REGION           || "eu-west-1",
  userPoolId:   import.meta.env.VITE_USER_POOL_ID     || "",
  clientId:     import.meta.env.VITE_USER_POOL_CLIENT_ID || "",
};

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
