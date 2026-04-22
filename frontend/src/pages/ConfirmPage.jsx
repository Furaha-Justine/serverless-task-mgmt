
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ConfirmPage() {
  const { confirmSignup } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");
  const [done, setDone]   = useState(false);
  const [busy, setBusy]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await confirmSignup(email, code);
      setDone(true);
    } catch (err) {
      setError(err.message || "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>✅</div>
          <div className="auth-title" style={{ marginTop: 12 }}>Email Verified!</div>
          <p style={{ color: "#666", margin: "12px 0 24px" }}>
            Your account is confirmed. An admin will add you to the appropriate group before you can access tasks.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Verify Email</div>
        <div className="auth-sub">Enter the 6-digit code sent to your email.</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Verification Code</label>
            <input className="form-control" required maxLength={6} value={code}
              placeholder="123456"
              onChange={e => setCode(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
