
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getTaskById, updateTask, assignTask, closeTask } from "../services/api";
import { getUsers } from "../services/api";

const STATUS_OPTS = ["OPEN", "TODO", "IN_PROGRESS", "DONE", "CLOSED"];
const MEMBER_STATUS_OPTS = ["TODO", "IN_PROGRESS", "DONE"];

export default function TaskDetail() {
  const { taskId }   = useParams();
  const { user, getIdToken } = useAuth();
  const navigate     = useNavigate();

  const [task,    setTask]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // Assign modal state
  const [showAssign,   setShowAssign]   = useState(false);
  const [allUsers,     setAllUsers]     = useState([]);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [assignBusy,   setAssignBusy]   = useState(false);
  const [assignErr,    setAssignErr]    = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  const [statusBusy, setStatusBusy] = useState(false);
  const [closeBusy,  setCloseBusy]  = useState(false);

  useEffect(() => { loadTask(); }, [taskId]);

  async function loadTask() {
    setLoading(true); setError("");
    try {
      const data = await getTaskById(taskId, getIdToken);
      setTask(data.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openAssignModal() {
    setShowAssign(true);
    setSelectedIds([]);
    setAssignErr("");
    setUsersLoading(true);
    try {
      const data = await getUsers(getIdToken);
      // Filter out already assigned users and show only active members
      const assignedIds = (task.assignees || []).map(a => a.userId);
      setAllUsers((data.users || []).filter(u => !assignedIds.includes(u.userId)));
    } catch (err) {
      setAssignErr("Could not load users: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  }

  function toggleUser(userId) {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedIds.length) return setAssignErr("Select at least one member");
    setAssignErr(""); setAssignBusy(true);
    try {
      await assignTask(taskId, { userIds: selectedIds }, getIdToken);
      setShowAssign(false);
      setSelectedIds([]);
      await loadTask();
      setSuccess(`Assigned ${selectedIds.length} member(s). Email notifications sent.`);
    } catch (err) {
      setAssignErr(err.message);
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleStatusChange(e) {
    const status = e.target.value;
    setStatusBusy(true); setError(""); setSuccess("");
    try {
      const data = await updateTask(taskId, { status }, getIdToken);
      setTask(data.task);
      setSuccess("Status updated. Notifications sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleClose() {
    if (!confirm("Close this task? This cannot be undone.")) return;
    setCloseBusy(true); setError(""); setSuccess("");
    try {
      const data = await closeTask(taskId, getIdToken);
      setTask(data.task);
      setSuccess("Task closed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setCloseBusy(false);
    }
  }

  if (loading) return <div className="spinner" />;
  if (error && !task) return <div className="alert alert-error">{error}</div>;
  if (!task) return null;

  const isClosed   = task.status === "CLOSED";
  const statusOpts = user?.isAdmin ? STATUS_OPTS : MEMBER_STATUS_OPTS;

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/tasks")} style={{ marginBottom: 8 }}>
            Back
          </button>
          <h1 className="page-title">{task.title}</h1>
        </div>
        {user?.isAdmin && !isClosed && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={openAssignModal}>Assign</button>
            <button className="btn btn-danger" onClick={handleClose} disabled={closeBusy}>
              {closeBusy ? "Closing..." : "Close Task"}
            </button>
          </div>
        )}
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Task Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: ".8rem", color: "#888", marginBottom: 4 }}>Description</div>
            <div>{task.description || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: ".8rem", color: "#888", marginBottom: 4 }}>Priority</div>
            <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
          </div>
          <div>
            <div style={{ fontSize: ".8rem", color: "#888", marginBottom: 4 }}>Due Date</div>
            <div>{task.dueDate || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: ".8rem", color: "#888", marginBottom: 4 }}>Created</div>
            <div>{task.createdAt?.slice(0, 10)}</div>
          </div>
        </div>
      </div>

      {/* Status Update */}
      {!isClosed && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Update Status</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              className="form-control"
              style={{ width: 200 }}
              value={task.status}
              onChange={handleStatusChange}
              disabled={statusBusy}
            >
              {statusOpts.map(s => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            {statusBusy && <span style={{ color: "#888", fontSize: ".85rem" }}>Saving...</span>}
          </div>
        </div>
      )}

      {/* Assignees */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>
          Assignees ({task.assignees?.length || 0})
        </div>
        {task.assignees?.length ? (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Assigned</th></tr>
            </thead>
            <tbody>
              {task.assignees.map(a => (
                <tr key={a.userId}>
                  <td>{a.name || "—"}</td>
                  <td>{a.email}</td>
                  <td>{a.assignedAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#888", fontSize: ".9rem" }}>No assignees yet.</div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Assign Members</div>
            {assignErr && <div className="alert alert-error">{assignErr}</div>}

            {usersLoading ? (
              <div className="spinner" />
            ) : allUsers.length === 0 ? (
              <div style={{ color: "#888", fontSize: ".9rem" }}>
                No available members to assign.
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #eee", borderRadius: 6 }}>
                {allUsers.map(u => (
                  <label
                    key={u.userId}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      background: selectedIds.includes(u.userId) ? "#f0f4ff" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.userId)}
                      onChange={() => toggleUser(u.userId)}
                    />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: ".9rem" }}>{u.name}</div>
                      <div style={{ fontSize: ".8rem", color: "#888" }}>{u.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAssign(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={assignBusy || !selectedIds.length}
              >
                {assignBusy ? "Assigning..." : `Assign (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
