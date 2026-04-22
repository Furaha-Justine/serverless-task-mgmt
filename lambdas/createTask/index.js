// lambdas/createTask/index.js
const { v4: uuidv4 } = require("uuid");
const { getCallerIdentity, requireAdmin, response } = require("./shared/auth");
const { putTask } = require("./shared/db");

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    requireAdmin(caller);

    const body = JSON.parse(event.body || "{}");
    const { title, description, priority, dueDate } = body;

    if (!title) {
      return response(400, { message: "title is required" });
    }

    const task = {
      taskId:      uuidv4(),
      title:       title.trim(),
      description: description || "",
      priority:    priority || "MEDIUM",  // LOW | MEDIUM | HIGH
      status:      "OPEN",               // OPEN | IN_PROGRESS | DONE | CLOSED
      dueDate:     dueDate || null,
      createdBy:   caller.userId,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };

    await putTask(task);
    return response(201, { task });
  } catch (err) {
    if (err.statusCode) return response(err.statusCode, { message: err.message });
    console.error("createTask error:", err);
    return response(500, { message: "Internal server error" });
  }
};
