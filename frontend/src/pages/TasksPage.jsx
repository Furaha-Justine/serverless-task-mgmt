
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getTasks } from "../services/api";

const STATUS_LABELS = {
  OPEN:        { label: "Open",        cls: "badge-open" },
  TODO:        { label: "To Do",       cls: "badge-open" },
  IN_PROGRESS: { label: "In Progress", cls: "badge-in_progress" },
  DONE:        { label: "Done",        cls: "badge-done" },
  CLOSED:      { label: "Closed",      cls: "badge-closed" },
};

const PRIORITY_LABELS = {
  HIGH:   { label: "High",   cls: "badge-high" },
  MEDIUM: { label: "Medium", cls: "badge-medium" },
  LOW:    { label: "Low",    cls: "badge-low" },
};

export default function TasksPage() {
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await getTasks(getIdToken);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const displayed = filter === "ALL"
    ? tasks
    : tasks.filter(t => t.status === filter);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{user?.isAdmin ? "All Tasks" : "My Tasks"}</h1>
        {user?.isAdmin && (
          <Link to="/tasks/new" className="btn btn-primary">+ New Task</Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["ALL", "OPEN", "TODO", "IN_PROGRESS", "DONE", "CLOSED"].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : displayed.length === 0 ? (
        <div className="card empty-state">
          {filter === "ALL" ? "No tasks yet." : `No ${STATUS_LABELS[filter]?.label} tasks.`}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(task => (
                  <tr key={task.taskId}>
                    <td>
                      <strong
                        style={{ cursor: "pointer", color: "#4f8ef7" }}
                        onClick={() => navigate(`/tasks/${task.taskId}`)}
                      >
                        {task.title}
                      </strong>
                      {task.description && (
                        <div style={{ fontSize: ".8rem", color: "#888", marginTop: 2 }}>
                          {task.description.slice(0, 60)}{task.description.length > 60 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_LABELS[task.status]?.cls}`}>
                        {STATUS_LABELS[task.status]?.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${PRIORITY_LABELS[task.priority]?.cls}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>{task.dueDate || "—"}</td>
                    <td>{task.createdAt?.slice(0, 10)}</td>
                    <td>
                      <Link to={`/tasks/${task.taskId}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
