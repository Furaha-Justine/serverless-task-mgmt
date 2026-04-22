// lambdas/shared/db.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.REGION });
const db = DynamoDBDocumentClient.from(client);

const TASKS_TABLE       = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;
const USERS_TABLE       = process.env.USERS_TABLE;

// ---- Tasks ----

async function getTask(taskId) {
  const res = await db.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
  return res.Item || null;
}

async function putTask(item) {
  await db.send(new PutCommand({ TableName: TASKS_TABLE, Item: item }));
}

async function updateTask(taskId, updates) {
  const keys   = Object.keys(updates);
  const expr   = "SET " + keys.map((k, i) => `#k${i} = :v${i}`).join(", ");
  const names  = Object.fromEntries(keys.map((k, i) => [`#k${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));

  const res = await db.send(new UpdateCommand({
    TableName: TASKS_TABLE,
    Key: { taskId },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));
  return res.Attributes;
}

async function getAllTasks() {
  const res = await db.send(new ScanCommand({ TableName: TASKS_TABLE }));
  return res.Items || [];
}

// ---- Assignments ----

async function getAssignment(taskId, userId) {
  const res = await db.send(new GetCommand({
    TableName: ASSIGNMENTS_TABLE,
    Key: { taskId, userId },
  }));
  return res.Item || null;
}

async function putAssignment(item) {
  await db.send(new PutCommand({ TableName: ASSIGNMENTS_TABLE, Item: item }));
}

async function getAssignmentsByTask(taskId) {
  const res = await db.send(new QueryCommand({
    TableName: ASSIGNMENTS_TABLE,
    KeyConditionExpression: "taskId = :tid",
    ExpressionAttributeValues: { ":tid": taskId },
  }));
  return res.Items || [];
}

async function getAssignmentsByUser(userId) {
  const res = await db.send(new QueryCommand({
    TableName: ASSIGNMENTS_TABLE,
    IndexName: "UserIndex",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  }));
  return res.Items || [];
}

// ---- Users ----

async function getUser(userId) {
  const res = await db.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }));
  return res.Item || null;
}

async function getUserByEmail(email) {
  const res = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :e",
    ExpressionAttributeValues: { ":e": email },
  }));
  return res.Items?.[0] || null;
}

async function putUser(item) {
  await db.send(new PutCommand({ TableName: USERS_TABLE, Item: item }));
}

module.exports = {
  getTask, putTask, updateTask, getAllTasks,
  getAssignment, putAssignment, getAssignmentsByTask, getAssignmentsByUser,
  getUser, getUserByEmail, putUser,
};
