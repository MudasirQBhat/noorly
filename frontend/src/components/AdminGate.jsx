import { useState } from "react";
import { useAdmin } from "../lib/admin.jsx";

// Hidden bottom-left trigger (visible on hover) → admin login modal.
export default function AdminGate() {
  const { admin, login, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await login(pw); setOpen(false); setPw(""); }
    catch (ex) { setErr(ex.message || "Login failed"); }
    finally { setBusy(false); }
  }

  return (
    <>
      {admin ? (
        <div className="admin-badge">
          <span className="admin-dot" />Admin
          <button onClick={logout} aria-label="Log out of admin">Log out</button>
        </div>
      ) : (
        <button className="admin-trigger" onClick={() => setOpen(true)} aria-label="Admin login">admin</button>
      )}

      {open && !admin && (
        <div className="admin-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Admin sign in">
          <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>Admin sign in</h3>
            <p>Enter the admin password to unlock downloads.</p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus autoComplete="current-password" />
            {err && <div className="admin-err">{err}</div>}
            <div className="admin-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !pw}>{busy ? "Signing in…" : "Sign in"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
