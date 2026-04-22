
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createTask } from "../services/api";

export default function CreateTask() {
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();

  // Redirect members away
  if (!user?.isAdmin) {
    navigate("/tasks");
    return null;
  }

  const [form, setForm]   = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const data = await createTask(form, getIdToken);
      navigate(`/tasks/${data.task.taskId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Create Task</h1>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={4} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-control" value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="form-control" type="date" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/tasks")}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
