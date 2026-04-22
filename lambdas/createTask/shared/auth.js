// lambdas/shared/auth.js

function getCallerIdentity(event) {
  const claims = event.requestContext?.authorizer?.claims || {};
  const groups = claims["cognito:groups"] || "";
  const groupList = Array.isArray(groups) ? groups : groups.split(",").filter(Boolean);
  return {
    userId: claims.sub,
    email: claims.email,
    groups: groupList,
    isAdmin: groupList.includes("Admins"),
    isMember: groupList.includes("Members"),
  };
}

function requireAdmin(caller) {
  if (!caller.isAdmin) {
    const err = new Error("Forbidden: Admin access required");
    err.statusCode = 403;
    throw err;
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

module.exports = { getCallerIdentity, requireAdmin, response };
