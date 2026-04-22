// lambdas/getUsers/index.js
// Returns only active Members - Admin only
const { getCallerIdentity, requireAdmin, response } = require("./shared/auth");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoIdentityProviderClient, ListUsersInGroupCommand } = require("@aws-sdk/client-cognito-identity-provider");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    requireAdmin(caller);

    // Get only users in the Members group from Cognito
    const cognitoRes = await cognito.send(new ListUsersInGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      GroupName:  "Members",
    }));

    const memberSubs = (cognitoRes.Users || []).map(u => {
      const sub = u.Attributes?.find(a => a.Name === "sub")?.Value;
      return sub;
    }).filter(Boolean);

    if (!memberSubs.length) return response(200, { users: [] });

    // Get their details from DynamoDB users table
    const dbRes = await db.send(new ScanCommand({
      TableName:        process.env.USERS_TABLE,
      FilterExpression: "#active = :true",
      ExpressionAttributeNames:  { "#active": "active" },
      ExpressionAttributeValues: { ":true": true },
    }));

    const users = (dbRes.Items || [])
      .filter(u => memberSubs.includes(u.userId))
      .map(u => ({
        userId: u.userId,
        email:  u.email,
        name:   u.name,
      }));

    return response(200, { users });
  } catch (err) {
    if (err.statusCode) return response(err.statusCode, { message: err.message });
    console.error("getUsers error:", err);
    return response(500, { message: err.message });
  }
};
