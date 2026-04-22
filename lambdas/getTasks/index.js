// lambdas/getTasks/index.js
const { getCallerIdentity, response } = require("./shared/auth");
const { getAllTasks, getAssignmentsByUser, getTask } = require("./shared/db");

exports.handler = async (event) => {
  try {
    const caller = getCallerIdentity(event);

    if (caller.isAdmin) {
      // Admin: return all tasks
      const tasks = await getAllTasks();
      tasks.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return response(200, { tasks });
    }

    // Member: return only tasks assigned to them
    const assignments = await getAssignmentsByUser(caller.userId);
    const tasks = await Promise.all(
      assignments.map(async (a) => {
        const task = await getTask(a.taskId);
        return task
          ? { ...task, assignedAt: a.assignedAt }
          : null;
      })
    );

    const filtered = tasks.filter(Boolean);
    filtered.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return response(200, { tasks: filtered });
  } catch (err) {
    console.error("getTasks error:", err);
    return response(500, { message: "Internal server error" });
  }
};
