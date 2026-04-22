// lambdas/getTaskById/index.js
const { getCallerIdentity, response } = require("./shared/auth");
const { getTask, getAssignment, getAssignmentsByTask, getUser } = require("./shared/db");

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);
    const { taskId } = event.pathParameters || {};

    if (!taskId) return response(400, { message: "taskId is required" });

    const task = await getTask(taskId);
    if (!task) return response(404, { message: "Task not found" });

    // Members: must be assigned
    if (!caller.isAdmin) {
      const assignment = await getAssignment(taskId, caller.userId);
      if (!assignment) return response(403, { message: "Access denied" });
    }

    // Enrich with assignee list
    const assignments = await getAssignmentsByTask(taskId);
    const assignees = await Promise.all(
      assignments.map(async (a) => {
        const user = await getUser(a.userId);
        return user
          ? { userId: a.userId, email: user.email, name: user.name, assignedAt: a.assignedAt }
          : { userId: a.userId, assignedAt: a.assignedAt };
      })
    );

    return response(200, { task: { ...task, assignees } });
  } catch (err) {
    console.error("getTaskById error:", err);
    return response(500, { message: "Internal server error" });
  }
};
