import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../services/api";
export default function Auth({ mode, onLogin }) {
  const login = mode === "login";
  const [f, setF] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const r = login
        ? await auth.login({ username: f.username, password: f.password })
        : await auth.signup(f);
      onLogin(r.data.user);
      nav("/listings");
    } catch (e) {
      setErr(e.response?.data?.error || "Something went wrong.");
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <div className="glass">
          <span className="eyebrow">WanderNest ✦</span>
          <h2>
            {login
              ? "Welcome back, explorer."
              : "Your next adventure starts here."}
          </h2>
          <p>
            Discover beautiful stays, save favourites and book securely with a
            polished travel experience.
          </p>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">{login ? "SIGN IN" : "CREATE ACCOUNT"}</span>
        <h1>{login ? "Welcome back" : "Join WanderNest"}</h1>
        <p className="muted">
          {login
            ? "Continue your travel journey."
            : "Save stays and start booking."}
        </p>
        {err && <div className="error-box">{err}</div>}
        <div className="field">
          <label>Username</label>
          <input
            required
            value={f.username}
            onChange={(e) => setF({ ...f, username: e.target.value })}
          />
        </div>
        {!login && (
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
        )}
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            minLength="6"
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </div>
        {login && (
          <Link className="small-link" to="/forgot-password">
            Forgot / change password?
          </Link>
        )}
        <button className="btn btn-primary form-submit">
          {login ? "Log in" : "Create account"}
        </button>
        <p className="muted center">
          {login ? (
            <>
              New here? <Link to="/signup">Create account</Link>
            </>
          ) : (
            <>
              Already registered? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
