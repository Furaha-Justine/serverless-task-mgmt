// lambdas/postConfirm/index.js
// Fires after a user confirms their email in Cognito.
// 1. Saves user to DynamoDB
// 2. Auto-verifies their email in SES so notifications work

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, VerifyEmailIdentityCommand } = require("@aws-sdk/client-ses");

const db  = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const ses = new SESClient({ region: process.env.REGION });

exports.handler = async (event) => {
  const { sub, email, name } = event.request.userAttributes;

  // 1. Save to DynamoDB
  await db.send(new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: {
      userId:    sub,
      email:     email.toLowerCase(),
      name:      name || email.split("@")[0],
      active:    true,
      createdAt: new Date().toISOString(),
    },
  }));

  // 2. Auto-verify their email in SES
  // This sends a verification email from AWS — user clicks it once
  // and all future notifications to them will work automatically
  try {
    await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
    console.log(`SES verification sent to ${email}`);
  } catch (err) {
    // Don't block signup if SES fails — just log it
    console.warn(`SES verification failed for ${email}:`, err.message);
  }

  return event;
};
