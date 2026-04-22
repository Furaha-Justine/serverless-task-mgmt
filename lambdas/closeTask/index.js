// lambdas/closeTask/index.js
const { getCallerIdentity, requireAdmin, response } = require("./shared/auth");
const { getTask, updateTask, getAssignmentsByTask, getUser } = require("./shared/db");
const { notifyStatusChange } = require("./shared/email");

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    requireAdmin(caller);

    const { taskId } = event.pathParameters || {};
    if (!taskId) return response(400, { message: "taskId is required" });

    const task = await getTask(taskId);
    if (!task) return response(404, { message: "Task not found" });
    if (task.status === "CLOSED") return response(400, { message: "Task is already closed" });

    const updated = await updateTask(taskId, {
      status:    "CLOSED",
      closedBy:  caller.userId,
      closedAt:  new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify all assigned members of closure
    const assignments = await getAssignmentsByTask(taskId);
    const recipientEmails = [];
    for (const a of assignments) {
      const user = await getUser(a.userId);
      if (user?.email) recipientEmails.push(user.email);
    }
    if (recipientEmails.length) {
      try {
        await notifyStatusChange(recipientEmails, updated, caller.email);
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr.message);
      }
    }

    return response(200, { task: updated });
  } catch (err) {
    if (err.statusCode) return response(err.statusCode, { message: err.message });
    console.error("closeTask error:", err);
    return response(500, { message: "Internal server error" });
  }
};
