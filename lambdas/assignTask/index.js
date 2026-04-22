// lambdas/assignTask/index.js
const { getCallerIdentity, requireAdmin, response } = require("./shared/auth");
const {
  getTask, getUser, getAssignment, putAssignment, getAssignmentsByTask
} = require("./shared/db");
const { notifyAssignment } = require("./shared/email");

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    requireAdmin(caller);

    const { taskId } = event.pathParameters || {};
    const body = JSON.parse(event.body || "{}");
    const { userIds } = body; // array of user IDs to assign

    if (!taskId) return response(400, { message: "taskId is required" });
    if (!Array.isArray(userIds) || !userIds.length) {
      return response(400, { message: "userIds array is required" });
    }

    const task = await getTask(taskId);
    if (!task) return response(404, { message: "Task not found" });
    if (task.status === "CLOSED") return response(400, { message: "Cannot assign a closed task" });

    const assigned = [];
    const skipped  = [];
    const newEmails = [];

    for (const userId of userIds) {
      // Prevent duplicate assignment
      const existing = await getAssignment(taskId, userId);
      if (existing) {
        skipped.push({ userId, reason: "already assigned" });
        continue;
      }

      // Ensure user is active
      const user = await getUser(userId);
      if (!user) {
        skipped.push({ userId, reason: "user not found" });
        continue;
      }
      if (!user.active) {
        skipped.push({ userId, reason: "user is deactivated" });
        continue;
      }

      await putAssignment({
        taskId,
        userId,
        assignedAt: new Date().toISOString(),
        assignedBy: caller.userId,
      });

      assigned.push(userId);
      newEmails.push(user.email);
    }

    // Notify newly assigned members
    if (newEmails.length) {
      try {
        await notifyAssignment(newEmails, task);
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr.message);
      }
    }

    return response(200, { assigned, skipped });
  } catch (err) {
    if (err.statusCode) return response(err.statusCode, { message: err.message });
    console.error("assignTask error:", err);
    return response(500, { message: "Internal server error" });
  }
};
