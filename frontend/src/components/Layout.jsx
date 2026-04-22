
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">📋 Task Manager</div>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/tasks" className={({ isActive }) => isActive ? "active" : ""}>
              🗂 All Tasks
            </NavLink>
          </li>
          {user?.isAdmin && (
            <li>
              <NavLink to="/tasks/new" className={({ isActive }) => isActive ? "active" : ""}>
                ➕ Create Task
              </NavLink>
            </li>
          )}
        </ul>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.email}<br />
            <small style={{ color: "#6b7394" }}>{user?.isAdmin ? "Admin" : "Member"}</small>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
