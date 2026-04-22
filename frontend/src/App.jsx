
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoginPage    from "./pages/LoginPage";
import SignupPage   from "./pages/SignupPage";
import ConfirmPage  from "./pages/ConfirmPage";
import TasksPage    from "./pages/TasksPage";
import TaskDetail   from "./pages/TaskDetail";
import CreateTask   from "./pages/CreateTask";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login"   element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup"  element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />

      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index         element={<Navigate to="/tasks" replace />} />
        <Route path="tasks"         element={<TasksPage />} />
        <Route path="tasks/new"     element={<CreateTask />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
      </Route>
    </Routes>
  );
}
