
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      await signup(form.email, form.password, form.name);
      navigate("/confirm", { state: { email: form.email } });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Create Account</div>
        <div className="auth-sub">Only @amalitech.com and @amalitechtraining.org emails are allowed.</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" required value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={form.email}
              placeholder="you@amalitech.com"
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required minLength={8} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <div className="form-error" style={{ color: "#888" }}>Min 8 chars, upper, lower, number, symbol</div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input className="form-control" type="password" required value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: ".9rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
