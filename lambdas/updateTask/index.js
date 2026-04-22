// lambdas/updateTask/index.js
const { getCallerIdentity, response } = require("./shared/auth");
const {
  getTask, updateTask, getAssignment, getAssignmentsByTask, getUser
} = require("./shared/db");
const { notifyStatusChange } = require("./shared/email");

const VALID_STATUSES        = ["OPEN", "TODO", "IN_PROGRESS", "DONE", "CLOSED"];
const MEMBER_ALLOWED_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    const { taskId } = event.pathParameters || {};
    let body = JSON.parse(event.body || "{}");

    if (!taskId) return response(400, { message: "taskId is required" });

    const task = await getTask(taskId);
    if (!task) return response(404, { message: "Task not found" });
    if (task.status === "CLOSED") return response(400, { message: "Cannot update a closed task" });

    if (!caller.isAdmin) {
      const assignment = await getAssignment(taskId, caller.userId);
      if (!assignment) return response(403, { message: "You are not assigned to this task" });

      const { status } = body;
      if (!status) return response(400, { message: "status is required" });
      if (!MEMBER_ALLOWED_STATUSES.includes(status)) {
        return response(400, { message: `Members can only set status to: ${MEMBER_ALLOWED_STATUSES.join(", ")}` });
      }
      body = { status };
    } else {
      if (body.status && !VALID_STATUSES.includes(body.status)) {
        return response(400, { message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
      }
    }

    const updates = { ...body, updatedAt: new Date().toISOString() };
    const updated = await updateTask(taskId, updates);

    // Notify all assigned members on status change
    if (body.status && body.status !== task.status) {
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
    }

    return response(200, { task: updated });
  } catch (err) {
    if (err.statusCode) return response(err.statusCode, { message: err.message });
    console.error("updateTask error:", err);
    return response(500, { message: err.message });
  }
};
